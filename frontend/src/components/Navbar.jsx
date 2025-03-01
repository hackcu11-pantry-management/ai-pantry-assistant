import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = ({ isLoggedIn }) => {
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
            <Link to="/profile">Profile</Link>
            <button className="logout-button">Logout</button>
          </>
        ) : (
          <>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/home" className="dev-link">Dev: HomePage</Link>
            <Link to="/dev-login" className="dev-link">Dev: Auto Login</Link>
            <button className="login-button">Login</button>
            <button className="signup-button">Sign Up</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 