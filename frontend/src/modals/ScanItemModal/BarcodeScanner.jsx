/** @module BarcodeScanner.jsx */

import { useEffect, useRef, useState } from "react";
import Quagga from "quagga";
import { useDispatch } from "react-redux";
import { toggleModal } from "../../redux/actions/modalActions";

const BarcodeScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState(null);
  const [productData, setProductData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const scannerRef = useRef(null);
  const quaggaInitialized = useRef(false);
  const dispatch = useDispatch();

  // Validate UPC code format
  const isValidUPC = (code) => {
    // Remove any non-digit characters
    const cleanCode = code.replace(/[^\d]/g, '');
    // Check if it's a valid length (UPC-A is 12 digits, UPC-E is 8 digits)
    return /^\d{8}$|^\d{12}$/.test(cleanCode);
  };

  // Clean UPC code
  const cleanUPC = (code) => {
    // Remove any non-digit characters and leading/trailing whitespace
    return code.replace(/[^\d]/g, '').trim();
  };

  const lookupUPC = async (upc) => {
    setIsLoading(true);
    setError(null);

    // Clean and validate the UPC
    const cleanedUPC = cleanUPC(upc);
    if (!isValidUPC(cleanedUPC)) {
      setError("Invalid UPC code format. Please try scanning again.");
      setIsLoading(false);
      return;
    }

    const maxRetries = 3;
    let retryCount = 0;
    let retryDelay = 2000; // Start with 2 seconds

    while (retryCount < maxRetries) {
      try {
        const response = await fetch(
          `http://localhost:5001/api/lookup-upc?upc=${cleanedUPC}`
        );
        const data = await response.json();

        console.log("Full API Response:", data);

        if (response.status === 429) {
          // Rate limited - use exponential backoff
          retryCount++;
          if (retryCount < maxRetries) {
            const waitTime = retryDelay * Math.pow(2, retryCount - 1);
            setError(
              `Rate limited, retrying in ${waitTime/1000} seconds... (Attempt ${retryCount}/${maxRetries})`
            );
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            continue;
          }
        }

        if (!data.success) {
          throw new Error(data.error || "Failed to lookup product");
        }

        if (data.items && data.items[0]) {
          const item = data.items[0];
          console.log("Item from API:", item);

          // Handle both API and database response formats
          const mappedData = {
            title: item.title || item.productname || "",
            brand: item.brand || item.productbrand || "",
            category: item.category || item.productcategory || "",
            size: item.size || item.productsize || "",
            weight: item.weight || item.productweight || "",
            color: item.color || item.productcolor || "",
            model: item.model || item.productmodel || "",
            dimension: item.dimension || item.productdimension || "",
            description: item.description || item.productdescription || "",
            lowest_recorded_price: item.lowest_recorded_price || item.productlowestprice || 0,
            highest_recorded_price: item.highest_recorded_price || item.producthighestprice || 0,
            currency: item.currency || item.productcurrency || "USD",
            images: item.images || item.productimages || [],
            upc: item.upc || item.productupc || cleanedUPC,
            purchaseDate: item.purchaseDate || item.productpurchaseDate || "",
            expiryDate: item.expiryDate || item.productexpiryDate || "",
            
          };

          console.log("Mapped Product Data:", mappedData);
          setProductData(mappedData);
          
          // Open the review modal with the product data
          dispatch(toggleModal("reviewItemModal", { productData: mappedData }));
          break; // Success - exit the retry loop
        } else {
          throw new Error("No product data found");
        }
      } catch (err) {
        retryCount++;
        if (retryCount === maxRetries) {
          setError(`Error looking up product: ${err.message}`);
          setProductData(null);
        } else {
          console.log(`Attempt ${retryCount} failed, retrying...`);
        }
      }
    }

    setIsLoading(false);
  };

  const onDetected = (result) => {
    const scannedCode = result.codeResult.code;
    console.log("Raw scanned code:", scannedCode);
    
    // Clean and validate the code before proceeding
    const cleanedCode = cleanUPC(scannedCode);
    if (!isValidUPC(cleanedCode)) {
      console.log("Invalid UPC detected:", scannedCode);
      return; // Don't process invalid codes
    }
    
    setBarcode(cleanedCode);
    stopScanner();
    lookupUPC(cleanedCode);
  };

  const startScanner = () => {
    if (scanning) return;

    // Reset any previous errors
    setError(null);

    // Check if the scanner element exists
    if (!scannerRef.current) {
      setError("Scanner element not found");
      return;
    }

    setScanning(true);

    // Use setTimeout to ensure the DOM is fully updated
    setTimeout(() => {
      Quagga.init(
        {
          inputStream: {
            type: "LiveStream",
            constraints: {
              facingMode: "environment",
            },
            target: scannerRef.current,
          },
          decoder: {
            readers: ["upc_reader", "upc_e_reader"],
          },
        },
        (err) => {
          if (!err) {
            quaggaInitialized.current = true;
            Quagga.start();
            Quagga.onDetected(onDetected);
          } else {
            console.error("Quagga initialization failed:", err);
            setError(
              `Failed to initialize scanner: ${err.message || "Unknown error"}`
            );
            setScanning(false);
          }
        }
      );
    }, 100); // Small delay to ensure DOM is ready
  };

  const stopScanner = () => {
    if (quaggaInitialized.current) {
      try {
        Quagga.offDetected(onDetected);
        Quagga.stop();
        quaggaInitialized.current = false;
      } catch (error) {
        console.error("Error stopping Quagga:", error);
      }
    }
    setScanning(false);
  };

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="barcode-scanner-container">
      <h2>Barcode Scanner</h2>

      <button
        onClick={scanning ? stopScanner : startScanner}
        className="scan-button"
        disabled={isLoading}
      >
        {scanning ? "Stop Scanning" : "Start Scanning"}
      </button>

      {error && (
        <div className="error-message" style={{ color: "red", margin: "10px 0" }}>
          {error}
        </div>
      )}

      <div
        ref={scannerRef}
        className="viewfinder"
        style={{
          width: "100%",
          maxWidth: "400px",
          height: "300px",
          margin: "20px auto",
          position: "relative",
          border: scanning ? "2px solid #ccc" : "none",
          overflow: "hidden",
          display: scanning ? "block" : "none",
        }}
      />

      {isLoading && <div className="loading">Looking up product...</div>}

      {barcode && !isLoading && (
        <div className="result">
          <h3>Scanned Code:</h3>
          <p>{barcode}</p>
        </div>
      )}

      {productData && !isLoading && (
        <div className="product-info">
          <h3>Product Information:</h3>
          <div className="product-details">
            <p>
              <strong>Name:</strong> {productData.title}
            </p>
            <p>
              <strong>Brand:</strong> {productData.brand}
            </p>
            <p>
              <strong>Category:</strong> {productData.category}
            </p>
            {productData.size && (
              <p>
                <strong>Size:</strong> {productData.size}
              </p>
            )}
            {productData.weight && (
              <p>
                <strong>Weight:</strong> {productData.weight}
              </p>
            )}
            {productData.color && (
              <p>
                <strong>Color:</strong> {productData.color}
              </p>
            )}
            {productData.model && (
              <p>
                <strong>Model:</strong> {productData.model}
              </p>
            )}
            {productData.dimension && (
              <p>
                <strong>Dimensions:</strong> {productData.dimension}
              </p>
            )}
            {(productData.lowest_recorded_price > 0 ||
              productData.highest_recorded_price > 0) && (
              <p>
                <strong>Price Range:</strong> {productData.currency || "$"}
                {productData.lowest_recorded_price} -{" "}
                {productData.highest_recorded_price}
              </p>
            )}
            {productData.offers && productData.offers.length > 0 && (
              <div>
                <strong>Current Offers:</strong>
                <ul className="mt-2">
                  {productData.offers.slice(0, 3).map((offer, index) => (
                    <li key={index} className="text-sm mb-1">
                      {offer.merchant}: ${offer.price}
                      {offer.shipping && ` + ${offer.shipping} shipping`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p>
              <strong>Description:</strong> {productData.description}
            </p>
          </div>
          {productData.images && productData.images.length > 0 && (
            <div className="product-image">
              <img
                src={productData.images[0]}
                alt={productData.title}
                style={{ maxWidth: "200px", marginTop: "10px" }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;