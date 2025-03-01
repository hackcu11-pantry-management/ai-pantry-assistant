import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Auth.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Basic validation
    if (!email) {
      setError("Please enter your email");
      setLoading(false);
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      // Mock password reset request - in a real app, this would be an API call
      // Simulating API call with timeout
      setTimeout(() => {
        // For demo purposes, we'll just show a success message
        setSuccess(true);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Forgot Password</h2>
        {error && <div className="auth-error">{error}</div>}

        {success ? (
          <div className="auth-success">
            <p>Password reset instructions have been sent to your email.</p>
            <p>
              Please check your inbox and follow the instructions to reset your
              password.
            </p>
            <div className="auth-footer mt-4">
              <Link to="/signin" className="auth-button">
                Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? "Sending..." : "Reset Password"}
            </button>
            <div className="auth-footer">
              <p>
                Remember your password? <Link to="/signin">Sign In</Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
