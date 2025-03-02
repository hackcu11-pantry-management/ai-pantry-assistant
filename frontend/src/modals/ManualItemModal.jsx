/** @module ManualItemModal.jsx */

import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Modal, Button } from "../common";
import { toggleModal } from "../redux/actions/modalActions";
import { addToPantry, addProduct } from "../redux/actions/productActions";

import Tooltip from "@mui/material/Tooltip";
import InfoIcon from "@mui/icons-material/Info";

// Food categories from backend
const FOOD_CATEGORIES = [
  "Fruits & Vegetables",
  "Meat & Seafood",
  "Dairy & Eggs",
  "Bread & Bakery",
  "Pantry Staples",
  "Snacks",
  "Beverages",
  "Frozen Foods",
  "Canned Goods",
  "Condiments & Sauces",
  "Baking Supplies",
  "Breakfast Foods",
  "Pasta & Rice",
  "Herbs & Spices",
  "Ready-to-Eat Meals",
  "Baby Food & Formula",
  "Pet Food",
  "Other"
];

// Placeholder image path
const PLACEHOLDER_IMAGE = "/food_placeholder.png";

const ManualItemModal = () => {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get today's date in YYYY-MM-DD format for default purchase date
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    unit: "units",
    purchaseDate: getTodayDate(),
    expiryDate: "",
    category: "Other"
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Generate a fake UPC for manual entries
  // Format: 999 (prefix for manual) + timestamp (to ensure uniqueness)
  const generateFakeUPC = () => {
    // Use current timestamp to ensure uniqueness
    const timestamp = Date.now().toString();
    // Prefix with 999 to indicate manual entry
    const fakeUPC = "999" + timestamp.substring(timestamp.length - 9);
    return fakeUPC;
  };

  const addItemToPantry = async () => {
    if (!formData.title || !formData.amount) {
      // Show validation error
      alert("Please enter a product name and quantity");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Generate a fake UPC for this manual entry
      const fakeUPC = generateFakeUPC();
      
      // First, create a product entry with the fake UPC
      const productData = {
        productUPC: fakeUPC,
        productName: formData.title,
        productCategory: formData.category, // Use selected category
        productBrand: "Manual Entry",
        productImages: [PLACEHOLDER_IMAGE] // Use placeholder image
      };
      
      console.log("Creating product:", productData);
      
      // Add the product to the database first
      await dispatch(addProduct(productData));
      
      // Then add it to the pantry
      const pantryData = {
        productUPC: fakeUPC,
        quantity: Number(formData.amount) || 1,
        quantityType: formData.unit,
        date_purchased: formData.purchaseDate,
        expiration_date: formData.expiryDate,
        isManualEntry: true // Flag to indicate this is a manual entry
      };
      
      console.log("Adding to pantry:", pantryData);
      
      await dispatch(addToPantry(pantryData));
      
      // Close the modal on success
      handleClose("manualItemModal");
    } catch (error) {
      console.error("Failed to add item:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (modal_id) => {
    dispatch(toggleModal(modal_id));
  };

  // Common button style to ensure consistent sizing
  const buttonStyle = {
    width: '80px',
    padding: '8px 16px',
    fontSize: '16px'
  };

  // Specific styles for each button
  const cancelButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#dc3545',
    borderColor: '#dc3545',
    color: 'white',
    transition: 'background-color 0.2s ease'
  };

  // Hover state for cancel button
  const handleCancelHover = (e, isHover) => {
    e.target.style.backgroundColor = isHover ? '#c82333' : '#dc3545';
    e.target.style.borderColor = isHover ? '#bd2130' : '#dc3545';
  };

  // Custom footer with our Button component
  const renderFooter = () => (
    <div style={{ display: 'flex', justifyContent: 'right', gap: '12px', marginTop: '1rem' }}>
      <button 
        className="btn"
        onClick={() => handleClose("manualItemModal")}
        disabled={isSubmitting}
        style={cancelButtonStyle}
        onMouseEnter={(e) => handleCancelHover(e, true)}
        onMouseLeave={(e) => handleCancelHover(e, false)}
      >
        Cancel
      </button>
      <button 
        className="btn btn-primary"
        onClick={addItemToPantry}
        disabled={isSubmitting}
        style={buttonStyle}
      >
        {isSubmitting ? "Saving..." : "Save"}
      </button>
    </div>
  );

  // Custom styles for responsive modal
  const modalStyles = {
    width: '100%',
    maxWidth: '800px', // Increased width for larger screens
    margin: '0 auto'
  };

  return (
    <Modal
      modal_id="manualItemModal"
      title="Add Item"
      footerButtons={[]}
      style={modalStyles}
    >
      <form className="product-form" style={{ width: '100%' }}>
        <div className="text-center mb-4">
          <img 
            src={PLACEHOLDER_IMAGE} 
            alt="Food placeholder" 
            style={{ maxWidth: '150px', maxHeight: '150px' }}
            className="img-thumbnail"
          />
        </div>

        <div className="form-group mb-3">
          <label htmlFor="title" className="form-label">
            Name
          </label>
          <input
            type="text"
            id="title"
            name="title"
            className="form-control"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group mb-3">
          <label htmlFor="category" className="form-label">
            Category
          </label>
          <select
            id="category"
            name="category"
            className="form-select"
            value={formData.category}
            onChange={handleChange}
          >
            {FOOD_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group mb-3">
          <label htmlFor="amount" className="form-label">
            Amount
          </label>
          <div className="input-group">
            <input
              type="number"
              id="amount"
              name="amount"
              className="form-control"
              value={formData.amount}
              onChange={handleChange}
              required
            />
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="form-select"
            >
              <option value="units">Units</option>
              <option value="g">Grams</option>
              <option value="kg">Kilograms</option>
              <option value="ml">Milliliters</option>
              <option value="l">Liters</option>
              <option value="oz">Ounces</option>
              <option value="lb">Pounds</option>
            </select>
          </div>
        </div>

        <div className="form-group mb-3">
          <label htmlFor="purchaseDate" className="form-label">
            Purchase Date
          </label>
          <input
            type="date"
            id="purchaseDate"
            name="purchaseDate"
            className="form-control"
            value={formData.purchaseDate}
            onChange={handleChange}
          />
        </div>

        <div className="form-group mb-3">
          <label htmlFor="expiryDate" className="form-label">
            Expiry Date
            <Tooltip title="Enter the expiration date from the product packaging">
              <InfoIcon
                fontSize="small"
                style={{ cursor: "pointer", paddingTop: "7px" }}
              />
            </Tooltip>
          </label>
          <input
            type="date"
            id="expiryDate"
            name="expiryDate"
            className="form-control"
            value={formData.expiryDate}
            onChange={handleChange}
          />
        </div>
        
        {renderFooter()}
      </form>
    </Modal>
  );
};

export default ManualItemModal;
