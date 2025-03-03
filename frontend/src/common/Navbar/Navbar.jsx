import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar = ({ isLoggedIn, onLogout }) => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // Get user info from localStorage if logged in
    if (isLoggedIn) {
      try {
        const userInfo = JSON.parse(localStorage.getItem("user"));
        if (userInfo && userInfo.name) {
          setUserName(userInfo.name);
        } else if (userInfo && userInfo.email) {
          // Use email as fallback
          setUserName(userInfo.email.split("@")[0]);
        }
      } catch (error) {
        console.error("Error parsing user info:", error);
      }
    }
  }, [isLoggedIn]);

  const handleLogout = () => {
    if (onLogout) {
      // Set local state immediately to prevent flashing content
      setUserName("");
      // Call the parent logout handler which will handle the redirect
      onLogout();
    }
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate("/", { state: { fromLogin: true } });
  };

  const handleSignIn = () => {
    navigate("/signin");
  };

  const handleSignUp = () => {
    navigate("/signup");
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/pantry">PantryPal</Link>
      </div>
      <div className="navbar-links">
        {isLoggedIn ? (
          <>
            <Link to="/pantry">Pantry</Link>
            <Link to="/recipes">Recipes</Link>
            <Link to="/calendar">Calendar</Link>
            {userName && (
              <span className="user-greeting">Hello, {userName}</span>
            )}
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button className="login-button" onClick={handleSignIn}>
              Login
            </button>
            <button className="signup-button" onClick={handleSignUp}>
              Sign Up
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
