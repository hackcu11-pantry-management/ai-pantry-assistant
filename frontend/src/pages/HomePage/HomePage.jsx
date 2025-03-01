import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./HomePage.css";

const HomePage = () => {
  const location = useLocation();

  // Mock user data - this would come from authentication in the future
  const [user, setUser] = useState({
    name: "User",
    pantryItems: [
      {
        id: 1,
        name: "Pasta",
        quantity: 2,
        unit: "boxes",
        expiryDate: "2023-12-31",
      },
      {
        id: 2,
        name: "Tomatoes",
        quantity: 5,
        unit: "items",
        expiryDate: "2023-11-15",
      },
      {
        id: 3,
        name: "Cheese",
        quantity: 1,
        unit: "block",
        expiryDate: "2023-11-10",
      },
    ],
    shoppingList: [
      { id: 1, name: "Milk", quantity: 1, unit: "gallon" },
      { id: 2, name: "Eggs", quantity: 12, unit: "items" },
    ],
  });

  // For development: Add a message when accessing directly
  const [directAccess, setDirectAccess] = useState(false);

  useEffect(() => {
    // Check if we're accessing the page directly (for development purposes)
    const isDirect = !location.state || !location.state.fromLogin;
    setDirectAccess(isDirect);

    // In a real app, we would check authentication here
    // and redirect to login if not authenticated
  }, [location]);

  return (
    <div className="home-container">
      {directAccess && (
        <div className="dev-message">
          <p>Development Mode: Accessing HomePage directly without login.</p>
          <p>In production, this would require authentication.</p>
        </div>
      )}

      <header className="home-header">
        <h1>Welcome to AI Pantry Assistant, {user.name}!</h1>
        <p>Manage your pantry and get recipe suggestions</p>
      </header>

      <div className="dashboard">
        <section className="pantry-section">
          <h2>Your Pantry</h2>
          <div className="pantry-items">
            {user.pantryItems.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Expiry Date</th>
                  </tr>
                </thead>
                <tbody>
                  {user.pantryItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>
                        {item.quantity} {item.unit}
                      </td>
                      <td>{item.expiryDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Your pantry is empty. Add some items!</p>
            )}
            <button className="add-button">Add Item</button>
          </div>
        </section>

        <section className="shopping-list-section">
          <h2>Shopping List</h2>
          <div className="shopping-items">
            {user.shoppingList.length > 0 ? (
              <ul>
                {user.shoppingList.map((item) => (
                  <li key={item.id}>
                    {item.name} - {item.quantity} {item.unit}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Your shopping list is empty.</p>
            )}
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
