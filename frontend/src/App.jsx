import React, { useState, useRef, useEffect } from "react";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";

import { Navbar } from "./common";

import LandingPage from "./pages/LandingPage/LandingPage";
import ExamplePage from "./pages/ExamplePage";
import HomePage from "./pages/HomePage/HomePage";

import Quagga from "quagga";

import "./App.css";

// Development component that auto-logs in and redirects to home
const DevAutoLogin = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Set logged in and redirect to home
    setIsLoggedIn(true);
    navigate("/home", { state: { fromLogin: true } });
  }, [setIsLoggedIn, navigate]);

  return <div className="container text-center mt-5">Logging in...</div>;
};

function BarcodeScanner() {
  const [scanning, setScanning] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const quaggaInitialized = useRef(false);

  const onDetected = (result) => {
    setBarcode(result.codeResult.code);
    stopScanner();
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
            readers: [
              "upc_reader",
              "upc_e_reader",
              "ean_reader",
              "ean_8_reader",
            ],
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
            setScanning(false);
          }
        },
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
      >
        {scanning ? "Stop Scanning" : "Start Scanning"}
      </button>

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
          border: scanning ? "2px solid #ccc" : "none",
          overflow: "hidden",
          display: scanning ? "block" : "none",
        }}
      />

      {barcode && (
        <div className="result">
          <h3>Scanned Code:</h3>
          <p>{barcode}</p>
        </div>
      )}
    </div>
  );
}

function App() {
  // Mock authentication state - this would be handled by a proper auth system later
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <Router>
      <Navbar isLoggedIn={isLoggedIn} />
      <div className="app-container">
        <Routes>
          <Route
            path="/"
            element={<LandingPage setIsLoggedIn={setIsLoggedIn} />}
          />
          <Route path="/ex" element={<ExamplePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/scan" element={<BarcodeScanner />} />
          {/* Development route - remove before production */}
          <Route
            path="/dev-login"
            element={<DevAutoLogin setIsLoggedIn={setIsLoggedIn} />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
