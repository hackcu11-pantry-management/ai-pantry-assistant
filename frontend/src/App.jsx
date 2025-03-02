import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { Navbar, SnackbarProvider } from "./common";

import { SignIn, SignUp } from "./pages/Auth";
import CalendarPage from "./pages/CalendarPage/CalendarPage";
import ExamplePage from "./pages/ExamplePage";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import LandingPage from "./pages/LandingPage/LandingPage";
import NewLandingPage from "./pages/NewLandingPage/NewLandingPage";
import RecipePage from "./pages/RecipePage/RecipePage";

import ModalProvider from "./ModalProvider";
import "./App.css";
import { logout, addLoginAuthentication } from "./redux/actions/userActions";

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
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dispatch = useDispatch();
  const loginResult = useSelector((state) => state.userState.loginResult);

  // Check for existing user session on app load
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      setIsLoggedIn(true);
    } else {
      // Check localStorage as fallback
      const userString = localStorage.getItem("user");
      if (userString) {
        try {
          const userData = JSON.parse(userString);
          // Restore user data to Redux state
          dispatch(addLoginAuthentication(userData));
          setIsLoggedIn(true);
        } catch (error) {
          console.error("Error parsing user data from localStorage:", error);
          localStorage.removeItem("user");
        }
      }
    }
  }, [loginResult, dispatch]);

  // Handle logout
  const handleLogout = () => {
    // Set logging out state to prevent content flash
    setIsLoggingOut(true);

    // Clear Redux state and localStorage
    dispatch(logout());
    localStorage.removeItem("user");

    // Short timeout to ensure state updates before redirect
    setTimeout(() => {
      // Redirect to signin page
      window.location.replace("/signin");

      // Update local state last (though this won't matter due to the redirect)
      setIsLoggedIn(false);
    }, 50);
  };

  // If logging out, show minimal UI
  if (isLoggingOut) {
    return (
      <div className="logging-out-container">
        <div className="logging-out-message">Logging out...</div>
      </div>
    );
  }

  const MainLayout = ({ children }) => {
    const location = useLocation();
    const isLandingPage = location.pathname === "/";
    console.log(isLandingPage);
  
    return (
      <div>
        {!isLandingPage && <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />}
        {children}
      </div>
    );
  };

  return (
    <Router>
      <ModalProvider />
      <MainLayout>
      <SnackbarProvider />
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
            path="/"
            element={<NewLandingPage setIsLoggedIn={setIsLoggedIn} />}
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected routes */}
          <Route
            path="/pantry"
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <LandingPage />
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
          <Route
            path="/calendar"
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <CalendarPage />
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
      </MainLayout>
    </Router>
  );
}

export default App;
