import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

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
import RecipePage from "./pages/RecipePage/RecipePage";
import { SignIn, SignUp } from "./pages/Auth"; // Make sure this import is correct
import ForgotPassword from "./pages/Auth/ForgotPassword";

import ModalProvider from "./ModalProvider";

import "./App.css";
import { logout } from "./redux/actions/userActions";

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
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const dispatch = useDispatch();
  const loginResult = useSelector((state) => state.userState.loginResult);

  // Check for existing user session on app load
  useEffect(() => {
    // If we have a loginResult from Redux, use that
    if (loginResult) {
      setIsLoggedIn(true);
    } else {
      // Check localStorage as fallback
      const user = localStorage.getItem("user");
      if (user) {
        setIsLoggedIn(true);
      }
    }
  }, [loginResult]);

  // Handle logout
  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("user");
    setIsLoggedIn(false);
  };

  return (
    <Router>
      <ModalProvider />
      <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      <div className="app-container">
        <Routes>
          {/* Public routes */}
          <Route
            path="/"
            element={<LandingPage setIsLoggedIn={setIsLoggedIn} />}
          />
          <Route
            path="/signin"
            element={<SignIn setIsLoggedIn={setIsLoggedIn} />}
          />
          <Route
            path="/signup"
            element={<SignUp setIsLoggedIn={setIsLoggedIn} />}
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected routes */}
          <Route path="/home" element={<HomePage />} />
          <Route path="/recipes" element={<RecipePage />} />

          {/* Development routes */}
          <Route path="/ex" element={<ExamplePage />} />
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
