/** @module LandingPage.jsx */

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Card, CardHeader, DetailLine, ProductGrid } from "../../common";
import { toggleModal } from "../../redux/actions/modalActions";
import {
  getUserPantry,
  selectProduct,
} from "../../redux/actions/productActions";

import "./LandingPage.css";

const LandingPage = () => {
  const dispatch = useDispatch();
  const pantryItems = useSelector((state) => state.productState.products);
  const isAuthenticated = useSelector(
    (state) => !!state.userState.loginResult?.token,
  );
  const authState = useSelector((state) => state.userState.loginResult);
  const userFirstName = useSelector((state) => state.userState.loginResult?.userFirstName);
  const pantryHeaderText = userFirstName ? `${userFirstName}'s Pantry` : "My Pantry";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [collapsedCategories, setCollapsedCategories] = useState({});

  useEffect(() => {
    // Debug authentication state
    console.log("Auth State:", authState);
    console.log("Is Authenticated:", isAuthenticated);

    // Fetch pantry items if authenticated
    if (isAuthenticated) {
      setLoading(true);
      setError(null);
      console.log("Dispatching getUserPantry");
      dispatch(getUserPantry())
        .then((response) => {
          console.log("getUserPantry success:", response);
          setLoading(false);
        })
        .catch((err) => {
          console.error("getUserPantry error:", err);
          setError(err.message || "Failed to load pantry items");
          setLoading(false);
        });
    } else {
      console.log("Not authenticated, skipping API call");
      setLoading(false);
      setError("Please log in to view your pantry items");
    }
  }, [dispatch, isAuthenticated, authState]);

  // Handle toggling category collapse
  const handleToggleCollapse = (category) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleOpenModal = (modal_id) => {
    dispatch(toggleModal(modal_id));
  };

  // Handle item click to open edit modal
  const handleItemClick = (item) => {
    console.log("Item clicked:", item);
    // Select the item in the store
    dispatch(selectProduct(item));
    // Open the edit modal
    handleOpenModal("editItemModal");
  };


  // Group pantry items by category
  const groupedPantryItems = pantryItems.reduce((acc, item) => {
    const category = item.productcategory || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }

    // Format expiry date with error handling
    let formattedExpiry = "N/A";
    if (item.expiration_date) {
      try {
        const expiryDate = new Date(item.expiration_date);
        if (!isNaN(expiryDate.getTime())) {
          formattedExpiry = expiryDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });
        }
      } catch (e) {
        console.error("Error formatting date:", e);
      }
    }

    acc[category].push({
      id: item.pantryid,
      name: item.productname,
      expiry: formattedExpiry,
      image:
        item.productimages && item.productimages.length > 0
          ? item.productimages[0]
          : "https://via.placeholder.com/150?text=No+Image",
      quantity: `${item.quantity} ${item.quantitytype || "items"}`,
      // Store original dates for editing
      purchaseDate: item.date_purchased,
      category: item.productcategory,
    });
    return acc;
  }, {});

  return (
    <div className="page-container">
      <Card>
        <CardHeader
          text={pantryHeaderText}
          buttons={[
            {
              text: "Scan Item",
              onClick: () => handleOpenModal("scanItemModal"),
              variant: "accent",
            },
            {
              text: "Manual Add",
              onClick: () => handleOpenModal("manualItemModal"),
              variant: "accent",
            },
          ]}
        />

        {loading ? (
          <div className="loading-container">Loading your pantry items...</div>
        ) : error ? (
          <div className="error-container">
            {error}
            {!isAuthenticated && (
              <button
                className="login-button"
                onClick={() => handleOpenModal("loginModal")}
              >
                Login Now
              </button>
            )}
          </div>
        ) : Object.keys(groupedPantryItems).length > 0 ? (
          Object.entries(groupedPantryItems).map(([category, items]) => (
            <div key={category}>
              <DetailLine 
                title={category} 
                isCollapsed={collapsedCategories[category]} 
                onToggleCollapse={() => handleToggleCollapse(category)} 
              />
              <div className={`category-content ${collapsedCategories[category] ? 'collapsed' : 'expanded'}`}>
                <ProductGrid data={items} onItemClick={handleItemClick} />
              </div>
            </div>
          ))
        ) : (
          <div className="empty-pantry">
            <p>Your pantry is empty. Add some items!</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default LandingPage;
