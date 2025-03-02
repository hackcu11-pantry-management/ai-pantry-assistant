import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getUserPantry } from "../../redux/actions/productActions";
import "./HomePage.css";

const HomePage = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const pantryItems = useSelector((state) => state.productState.products);
  const isAuthenticated = useSelector((state) => !!state.userState.loginResult?.token);
  const username = useSelector((state) => state.userState.loginResult?.username || "User");

  // For development: Add a message when accessing directly
  const [directAccess, setDirectAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if we're accessing the page directly (for development purposes)
    const isDirect = !location.state || !location.state.fromLogin;
    setDirectAccess(isDirect);

    // Fetch pantry items if authenticated
    if (isAuthenticated) {
      setLoading(true);
      setError(null);
      dispatch(getUserPantry())
        .then(() => setLoading(false))
        .catch((err) => {
          setError(err.message || "Failed to load pantry items");
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [location, dispatch, isAuthenticated]);

  // Group pantry items by category
  const groupedPantryItems = pantryItems.reduce((acc, item) => {
    const category = item.productcategory || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  return (
    <div className="home-container">
      {directAccess && (
        <div className="dev-message">
          <p>Development Mode: Accessing HomePage directly without login.</p>
          <p>In production, this would require authentication.</p>
        </div>
      )}

      <header className="home-header">
        <h1>Welcome to AI Pantry Assistant, {username}!</h1>
        <p>Manage your pantry and get recipe suggestions</p>
      </header>

      <div className="dashboard">
        <section className="pantry-section">
          <h2>Your Pantry</h2>
          {loading ? (
            <div className="loading">Loading your pantry items...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : (
            <div className="pantry-items">
              {Object.keys(groupedPantryItems).length > 0 ? (
                Object.entries(groupedPantryItems).map(([category, items]) => (
                  <div key={category} className="pantry-category">
                    <h3>{category}</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Quantity</th>
                          <th>Expiry Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.pantryid}>
                            <td>{item.productname}</td>
                            <td>
                              {item.quantity} {item.quantitytype}
                            </td>
                            <td>{item.expiration_date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))
              ) : (
                <p>Your pantry is empty. Add some items!</p>
              )}
              <button className="add-button">Add Item</button>
            </div>
          )}
        </section>

        <section className="shopping-list-section">
          <h2>Shopping List</h2>
          <div className="shopping-items">
            <p>Your shopping list is empty.</p>
            <button className="add-button">Add to List</button>
          </div>
        </section>

        <section className="recipe-section">
          <h2>Recipe Suggestions</h2>
          <p>Based on your pantry items, we recommend:</p>
          <div className="recipe-cards">
            <div className="recipe-card">
              <h3>Pasta with Tomato Sauce</h3>
              <p>You have 3/4 ingredients needed</p>
              <button>View Recipe</button>
            </div>
            <div className="recipe-card">
              <h3>Cheese Sandwich</h3>
              <p>You have 1/3 ingredients needed</p>
              <button>View Recipe</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;
