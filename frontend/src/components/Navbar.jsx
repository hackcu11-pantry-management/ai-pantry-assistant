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
      onLogout();
      navigate("/");
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">AI Pantry Assistant</Link>
      </div>
      <div className="navbar-links">
        {isLoggedIn ? (
          <>
            <Link to="/home">Dashboard</Link>
            <Link to="/recipes">Recipes</Link>
            <Link to="/scan">Scan Items</Link>
            <div className="user-menu">
              <span className="user-greeting">Hello, {userName}</span>
              <Link to="/profile" className="profile-link">
                Profile
              </Link>
              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/signin" className="login-button">
              Sign In
            </Link>
            <Link to="/signup" className="signup-button">
              Sign Up
            </Link>

            {/* Development links - remove before production */}
            <div className="dev-links">
              <Link to="/home" className="dev-link">
                Dev: HomePage
              </Link>
              <Link to="/dev-login" className="dev-link">
                Dev: Auto Login
              </Link>
              <Link to="/scan" className="dev-link">
                Dev: Scanner
              </Link>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
