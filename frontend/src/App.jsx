import React, { useState, useEffect } from "react";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  Navigate,
} from "react-router-dom";

import { Navbar } from "./common";

import LandingPage from "./pages/LandingPage/LandingPage";
import RecipePage from "./pages/RecipePage/RecipePage";
import NewLandingPage from "./pages/NewLandingPage/NewLandingPage";
import ExamplePage from "./pages/ExamplePage";
import HomePage from "./pages/HomePage/HomePage";
import { SignIn, SignUp } from "./pages/Auth";
import ForgotPassword from "./pages/Auth/ForgotPassword";

import ModalProvider from "./ModalProvider";

import "./App.css";

// Development component that auto-logs in and redirects to home
const DevAutoLogin = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Set logged in and redirect to home
    setIsLoggedIn(true);
    navigate("/", { state: { fromLogin: true } });
  }, [setIsLoggedIn, navigate]);

  return <div className="container text-center mt-5">Logging in...</div>;
};

const ProtectedRoute = ({ isLoggedIn, children }) => {
  if (!isLoggedIn) {
    // Redirect to the new landing page if the user is not logged in
    return <Navigate to="/test" replace />;
  }
  return children;
};




function App() {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check for existing user session on app load
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      setIsLoggedIn(true);
    }
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    setIsLoggedIn(false);
  };

  return (
    <Router>
      <ModalProvider />
      <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout}/>
      <div className="app-container">
        <Routes>
          {/* Public routes */}
          <Route
            path="/signin"
            element={<SignIn setIsLoggedIn={setIsLoggedIn} />}
          />
          <Route
            path="/signup"
            element={<SignUp setIsLoggedIn={setIsLoggedIn} />}
          />
          <Route
            path="/test"
            element={<NewLandingPage setIsLoggedIn={setIsLoggedIn} />}
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected routes */}
          <Route
            path="/home"
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recipes"
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <RecipePage />
              </ProtectedRoute>
            }
          />

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