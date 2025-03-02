/** @module EditItemModal.jsx */

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal } from "../../common";
import { toggleModal } from "../../redux/actions/modalActions";
import { updatePantryItem } from "../../redux/actions/productActions";
import { addSnackbar } from "../../redux/actions/snackbarActions";
import Tooltip from "@mui/material/Tooltip";
import InfoIcon from "@mui/icons-material/Info";
import "./EditItemModal.css";

const EditItemModal = () => {
  const dispatch = useDispatch();
  const selectedItem =
    useSelector((state) => state.productState?.selected) ?? {};
  const [isSubmitting, setIsSubmitting] = useState(false);

  const PLACEHOLDER_IMAGE = "/food_placeholder.png";

  const [formData, setFormData] = useState({
    title: selectedItem.title || "",
    amount: selectedItem.size || "",
    unit: selectedItem.unit || "units",
    purchaseDate: selectedItem.purchaseDate || "",
    expiryDate: selectedItem.expiryDate || "",
  });

  // Parse quantity and type from the combined string
  const parseQuantityAndType = (quantityString) => {
    if (!quantityString) return { amount: "", unit: "units" };

    const parts = quantityString.split(" ");
    if (parts.length >= 2) {
      return {
        amount: parts[0],
        unit: parts.slice(1).join(" "),
      };
    }

    return { amount: parts[0], unit: "units" };
  };

  // Format date from ISO to YYYY-MM-DD
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    } catch (e) {
      console.error("Error formatting date:", e);
      return "";
    }
  };

  // Initialize form data from selected item
  useEffect(() => {
    if (selectedItem && selectedItem.id) {
      const { amount, unit } = parseQuantityAndType(selectedItem.quantity);

      setFormData({
        title: selectedItem.name || "",
        amount: amount || "",
        unit: unit || "units",
        purchaseDate: selectedItem.purchaseDate
          ? formatDate(selectedItem.purchaseDate)
          : "",
        expiryDate:
          selectedItem.expiry && selectedItem.expiry !== "N/A"
            ? formatDate(selectedItem.expiry)
            : "",
        category: selectedItem.category || "Other",
      });
    }
  }, [selectedItem]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const updateItemInPantry = async () => {
    if (!formData.title || !formData.amount) {
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
      const payload = {
        productUPC: selectedItem.upc,
        quantity: Number(formData.amount) || 1,
        quantityType: formData.unit,
        date_purchased: formData.purchaseDate,
        expiration_date: formData.expiryDate,
      };

      await dispatch(updatePantryItem(payload));

      handleClose("editItemModal");

      dispatch(
        addSnackbar({
          message: "Item updated successfully",
          severity: "success",
        }),
      );
    } catch (error) {
      console.error("Failed to update item:", error);
      dispatch(
        addSnackbar({
          message: error.message || "Failed to update item",
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
      modal_id="editItemModal"
      title="Edit Item"
      buttons={[
        {
          text: "Cancel",
          variant: "outlined",
          onClick: () => handleClose("editItemModal"),
          disabled: isSubmitting,
        },
        {
          text: "Save",
          variant: "contained",
          onClick: updateItemInPantry,
          disabled: isSubmitting,
        },
      ]}
    >
      <form className="edit-item-form">
        <div className="edit-item-image">
          <img
            src={selectedItem?.image || PLACEHOLDER_IMAGE}
            alt="Food placeholder"
            className="edit-item-image-content"
          />
        </div>
        <div className="edit-item-form-group">
          <label htmlFor="title" className="edit-item-form-label">
            Name <span className="edit-item-text-danger">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            className={`edit-item-form-control ${!formData.title ? "edit-item-border-danger" : ""}`}
            value={formData.title}
            onChange={handleChange}
            required
          />
          {!formData.title && (
            <small className="edit-item-text-danger">
              Product name is required
            </small>
          )}
        </div>

        <div className="edit-item-form-group">
          <label htmlFor="amount" className="edit-item-form-label">
            Amount <span className="edit-item-text-danger">*</span>
          </label>
          <div className="edit-item-input-group">
            <input
              type="number"
              id="amount"
              name="amount"
              className={`edit-item-form-control ${!formData.amount ? "edit-item-border-danger" : ""}`}
              value={formData.amount}
              onChange={handleChange}
              required
            />
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="edit-item-form-select"
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
            <small className="edit-item-text-danger">
              Quantity is required
            </small>
          )}
        </div>

        <div className="edit-item-form-group">
          <label htmlFor="purchaseDate" className="edit-item-form-label">
            Purchase Date
          </label>
          <input
            type="date"
            id="purchaseDate"
            name="purchaseDate"
            className="edit-item-form-control"
            value={formData.purchaseDate}
            onChange={handleChange}
          />
        </div>

        <div className="edit-item-form-group">
          <label htmlFor="expiryDate" className="edit-item-form-label">
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
            className="edit-item-form-control"
            value={formData.expiryDate}
            onChange={handleChange}
          />
        </div>
      </form>
    </Modal>
  );
};

export default EditItemModal;
