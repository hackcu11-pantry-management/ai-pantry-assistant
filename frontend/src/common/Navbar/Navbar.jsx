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

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate("/home", { state: { fromLogin: true } });
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
        <Link to="/">AI Pantry Assistant</Link>
      </div>
      <div className="navbar-links">
        {isLoggedIn ? (
          <>
            <Link to="/home" onClick={handleHomeClick}>
              Dashboard
            </Link>
            <Link to="/recipes">Recipes</Link>
            <Link to="/profile">Profile</Link>
            {userName && (
              <span className="user-greeting">Hello, {userName}</span>
            )}
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/home" className="dev-link">
              Dev: HomePage
            </Link>
            <Link to="/dev-login" className="dev-link">
              Dev: Auto Login
            </Link>
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
