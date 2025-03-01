import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import "./App.css";

import LandingPage from "./pages/LandingPage/LandingPage";
import ExamplePage from "./pages/ExamplePage";
import HomePage from "./pages/HomePage/HomePage";
import Navbar from "./common/Navbar/Navbar";

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
