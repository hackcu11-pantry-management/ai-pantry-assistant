/** @module EditItemModal.jsx */

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal } from "../common";
import { toggleModal } from "../redux/actions/modalActions";
import { updatePantryItem } from "../redux/actions/productActions";
import { addSnackbar } from "../redux/actions/snackbarActions";

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

const EditItemModal = () => {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedItem = useSelector((state) => state.productState.selected);

  // Format date from ISO to YYYY-MM-DD
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (e) {
      console.error("Error formatting date:", e);
      return "";
    }
  };

  // Parse quantity and type from the combined string
  const parseQuantityAndType = (quantityString) => {
    if (!quantityString) return { amount: "", unit: "units" };
    
    const parts = quantityString.split(' ');
    if (parts.length >= 2) {
      return {
        amount: parts[0],
        unit: parts.slice(1).join(' ')
      };
    }
    
    return { amount: parts[0], unit: "units" };
  };

  // Initialize form data from selected item
  useEffect(() => {
    if (selectedItem && selectedItem.id) {
      const { amount, unit } = parseQuantityAndType(selectedItem.quantity);
      
      setFormData({
        title: selectedItem.name || "",
        amount: amount || "",
        unit: unit || "units",
        purchaseDate: selectedItem.purchaseDate ? formatDate(selectedItem.purchaseDate) : "",
        expiryDate: selectedItem.expiry && selectedItem.expiry !== "N/A" ? formatDate(selectedItem.expiry) : "",
        category: selectedItem.category || "Other"
      });
    }
  }, [selectedItem]);

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    unit: "units",
    purchaseDate: "",
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

  const updateItem = async () => {
    if (!formData.title || !formData.amount) {
      // Show validation error using snackbar instead of alert
      dispatch(addSnackbar({
        message: "Please enter a product name and quantity",
        severity: "error",
      }));
      return;
    }

    if (!selectedItem || !selectedItem.id) {
      dispatch(addSnackbar({
        message: "No item selected for update",
        severity: "error",
      }));
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare update data
      const updateData = {
        quantity: Number(formData.amount) || 1,
        quantityType: formData.unit,
        date_purchased: formData.purchaseDate,
        expiration_date: formData.expiryDate
      };
      
      console.log("Updating pantry item:", updateData);
      
      // Update the pantry item
      await dispatch(updatePantryItem(selectedItem.id, updateData));
      
      // Close the modal on success
      handleClose("editItemModal");
      
      // Show success message
      dispatch(addSnackbar({
        message: "Item updated successfully",
        severity: "success",
      }));
    } catch (error) {
      console.error("Failed to update item:", error);
      dispatch(addSnackbar({
        message: error.message || "Failed to update item",
        severity: "error",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (modal_id) => {
    dispatch(toggleModal(modal_id));
  };

  return (
    <Modal
      modal_id="editItemModal"
      title="Edit Item"
      footerButtons={[
        {
          text: "Cancel",
          variant: "outlined",
          onClick: () => handleClose("editItemModal"),
          disabled: isSubmitting,
        },
        {
          text: isSubmitting ? "Saving..." : "Save Changes",
          variant: "contained",
          onClick: () => updateItem(),
          disabled: isSubmitting,
        },
      ]}
    >
      <form className="product-form">
        <div className="text-center mb-4">
          <img 
            src={selectedItem?.image || PLACEHOLDER_IMAGE} 
            alt="Product" 
            style={{ maxWidth: "150px", maxHeight: "150px" }}
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
            disabled={true} // Name is read-only in edit mode
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
            disabled={true} // Category is read-only in edit mode
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
      </form>
    </Modal>
  );
};

export default EditItemModal; 