/** @module BarcodeScanner.jsx */

import React, { useEffect, useRef, useState } from "react";
import Quagga from "quagga";
import { useDispatch } from "react-redux";
import { selectProduct } from "../../redux/actions/productActions";
import { toggleModal } from "../../redux/actions/modalActions";

const BarcodeScanner = () => {
  const dispatch = useDispatch();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const scannerRef = useRef(null);
  const quaggaInitialized = useRef(false);
  const detectionInProgress = useRef(false); // Flag to prevent multiple detections

  // Validate UPC code format
  const isValidUPC = (code) => {
    const cleanCode = code.replace(/[^\d]/g, "");
    return /^\d{8}$|^\d{12}$/.test(cleanCode);
  };

  // Clean UPC code
  const cleanUPC = (code) => {
    return code.replace(/[^\d]/g, "").trim();
  };

  const lookupUPC = (upc) => {
    setIsLoading(true);
    setError(null);

    const cleanedUPC = cleanUPC(upc);
    if (!isValidUPC(cleanedUPC)) {
      setError("Invalid UPC code format. Please try scanning again.");
      setIsLoading(false);
      return;
    }

    fetch(`http://localhost:5001/api/lookup-upc?upc=${cleanedUPC}`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.success) {
          throw new Error(data.error || "Failed to lookup product");
        }

        if (data.items && data.items[0]) {
          const item = data.items[0];
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
            lowest_recorded_price:
              item.lowest_recorded_price || item.productlowestprice || 0,
            highest_recorded_price:
              item.highest_recorded_price || item.producthighestprice || 0,
            currency: item.currency || item.productcurrency || "USD",
            images: item.images || item.productimages || [],
            upc: item.upc || item.productupc || cleanedUPC,
            purchaseDate: item.purchaseDate || item.productpurchaseDate || "",
            expiryDate: item.expiryDate || item.productexpiryDate || "",
          };

          return mappedData;
        }

        return {};
      })
      .then((data) => {
        dispatch(selectProduct(data));
        dispatch(toggleModal("scanItemModal"));
        return data;
      })
      .then((data) => {
        dispatch(toggleModal("reviewItemModal"));
      })
      .catch((err) => {
        setError(`Error looking up product: ${err.message}`);
      })
      .finally(() => {
        setIsLoading(false);
        detectionInProgress.current = false; // Reset the flag after processing
      });
  };

  const onDetected = (result) => {
    if (detectionInProgress.current) return; // Prevent multiple detections
    detectionInProgress.current = true; // Set the flag

    const scannedCode = result.codeResult.code;
    const cleanedCode = cleanUPC(scannedCode);
    if (!isValidUPC(cleanedCode)) {
      console.log("Invalid UPC detected:", scannedCode);
      detectionInProgress.current = false; // Reset the flag
      return;
    }

    stopScanner();
    lookupUPC(cleanedCode);
  };

  const startScanner = () => {
    setError(null);

    if (!scannerRef.current) {
      setError("Scanner element not found");
      return;
    }

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
              `Failed to initialize scanner: ${err.message || "Unknown error"}`,
            );
          }
        },
      );
    }, 100);
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
  };

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="barcode-scanner-container">
      <h2>Barcode Scanner</h2>

      {error && (
        <div
          className="error-message"
          style={{ color: "red", margin: "10px 0" }}
        >
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
          border: "2px solid #ccc",
          overflow: "hidden",
        }}
      />

      {isLoading && <div className="loading">Looking up product...</div>}
    </div>
  );
};

export default BarcodeScanner;
