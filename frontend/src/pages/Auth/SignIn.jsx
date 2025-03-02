import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../../redux/actions/userActions";
import "./Auth.css";

const SignIn = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Basic validation
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      // Call the login action
      const response = await dispatch(login(formData));
      
      if (response.success) {
        // Update local auth state
        setIsLoggedIn(true);
        
        // Redirect to home page
        navigate("/home", { state: { fromLogin: true } });
      } else {
        setError(response.error || "Invalid email or password");
      }
    } catch (err) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Sign In</h2>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>
          <div className="forgot-password">
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
