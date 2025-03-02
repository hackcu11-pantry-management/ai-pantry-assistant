/** @module ManualItemModal.jsx */

import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Modal } from "../../common";
import { toggleModal } from "../../redux/actions/modalActions";
import { addToPantry, addProduct } from "../../redux/actions/productActions";
import { addSnackbar } from "../../redux/actions/snackbarActions";
import Tooltip from "@mui/material/Tooltip";
import InfoIcon from "@mui/icons-material/Info";
import "./ManualItemModal.css";

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
  "Other",
];

// Placeholder image path
const PLACEHOLDER_IMAGE = "/food_placeholder.png";

const ManualItemModal = () => {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get today's date in YYYY-MM-DD format for default purchase date
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    unit: "units",
    purchaseDate: getTodayDate(),
    expiryDate: "",
    category: "Other",
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
      // Show validation error using snackbar instead of alert
      dispatch(
        addSnackbar({
          message: "Please enter a product name and quantity",
          severity: "error",
        }),
      );
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
        productImages: [PLACEHOLDER_IMAGE], // Use placeholder image
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
        isManualEntry: true, // Flag to indicate this is a manual entry
      };

      console.log("Adding to pantry:", pantryData);

      await dispatch(addToPantry(pantryData));

      // Close the modal on success
      handleClose("manualItemModal");

      // Show success message
      dispatch(
        addSnackbar({
          message: "Item added successfully",
          severity: "success",
        }),
      );
    } catch (error) {
      console.error("Failed to add item:", error);
      dispatch(
        addSnackbar({
          message: error.message || "Failed to add item",
          severity: "error",
        }),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (modal_id) => {
    dispatch(toggleModal(modal_id));
  };

  return (
    <Modal
      modal_id="manualItemModal"
      title="Add Item"
      buttons={[
        {
          text: "Cancel",
          variant: "outlined",
          onClick: () => handleClose("manualItemModal"),
          disabled: isSubmitting,
        },
        {
          text: "Save",
          variant: "contained",
          onClick: addItemToPantry,
          disabled: isSubmitting,
        },
      ]}
    >
      <form className="manual-item-form">
        <div className="manual-item-image">
          <img
            src={PLACEHOLDER_IMAGE}
            alt="Food placeholder"
            className="manual-item-image-content"
          />
        </div>

        <div className="manual-item-form-group">
          <label htmlFor="title" className="manual-item-form-label">
            Name <span className="manual-item-text-danger">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            className={`manual-item-form-control ${!formData.title ? "manual-item-border-danger" : ""}`}
            value={formData.title}
            onChange={handleChange}
            required
          />
          {!formData.title && (
            <small className="manual-item-text-danger">
              Product name is required
            </small>
          )}
        </div>

        <div className="manual-item-form-group">
          <label htmlFor="category" className="manual-item-form-label">
            Category
          </label>
          <select
            id="category"
            name="category"
            className="manual-item-form-select"
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

        <div className="manual-item-form-group">
          <label htmlFor="amount" className="manual-item-form-label">
            Amount <span className="manual-item-text-danger">*</span>
          </label>
          <div className="manual-item-input-group">
            <input
              type="number"
              id="amount"
              name="amount"
              className={`manual-item-form-control ${!formData.amount ? "manual-item-border-danger" : ""}`}
              value={formData.amount}
              onChange={handleChange}
              required
            />
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="manual-item-form-select"
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
          {!formData.amount && (
            <small className="manual-item-text-danger">
              Quantity is required
            </small>
          )}
        </div>

        <div className="manual-item-form-group">
          <label htmlFor="purchaseDate" className="manual-item-form-label">
            Purchase Date
          </label>
          <input
            type="date"
            id="purchaseDate"
            name="purchaseDate"
            className="manual-item-form-control"
            value={formData.purchaseDate}
            onChange={handleChange}
          />
        </div>

        <div className="manual-item-form-group">
          <label htmlFor="expiryDate" className="manual-item-form-label">
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
            className="manual-item-form-control"
            value={formData.expiryDate}
            onChange={handleChange}
          />
        </div>
      </form>
    </Modal>
  );
};

export default ManualItemModal;
