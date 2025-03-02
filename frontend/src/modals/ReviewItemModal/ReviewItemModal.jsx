/** @module ReviewItemModal.jsx */

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal } from "../../common";
import { toggleModal } from "../../redux/actions/modalActions";
import { addToPantry } from "../../redux/actions/productActions";
import { addSnackbar } from "../../redux/actions/snackbarActions";
import Tooltip from "@mui/material/Tooltip";
import InfoIcon from "@mui/icons-material/Info";
import "./ReviewItemModal.css";

const ReviewItemModal = () => {
  const dispatch = useDispatch();
  const selectedItem =
    useSelector((state) => state.productState?.selected) ?? {};
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: selectedItem.title || "",
    amount: selectedItem.size || "",
    unit: selectedItem.unit || "units",
    purchaseDate: selectedItem.purchaseDate || "",
    expiryDate: selectedItem.expiryDate || "",
  });

  useEffect(() => {
    setFormData({
      title: selectedItem.title || "",
      amount: selectedItem.size || "",
      unit: selectedItem.unit || "units",
      purchaseDate: selectedItem.purchaseDate || "",
      expiryDate: selectedItem.expiryDate || "",
    });
  }, [selectedItem]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addItemToPantry = () => {
    // Validate required fields
    if (!formData.title || !formData.amount) {
      dispatch(
        addSnackbar({
          message: "Please enter a product name and quantity",
          severity: "error",
        }),
      );
      return; // Keep modal open so user can fix the issues
    }

    if (!selectedItem || !selectedItem.upc) {
      dispatch(
        addSnackbar({
          message:
            "Product information is incomplete. Please try scanning again.",
          severity: "error",
        }),
      );
      // Close review modal and reopen scan modal to let user try again
      handleClose("reviewItemModal");
      dispatch(toggleModal("scanItemModal"));
      return;
    }

    const payload = {
      productUPC: String(selectedItem.upc || ""), // Ensure UPC is always a string
      quantity: Number(formData.amount) || 1,
      quantityType: formData.unit,
      date_purchased: formData.purchaseDate,
      expiration_date: formData.expiryDate,
    };

    console.log("payload", payload);
    setIsSubmitting(true);
    dispatch(addToPantry(payload))
      .then(() => {
        handleClose("reviewItemModal");
        // Show success message
        dispatch(
          addSnackbar({
            message: "Item added successfully",
            severity: "success",
          }),
        );
      })
      .catch((error) => {
        console.error("Failed to add item to pantry:", error);
        dispatch(
          addSnackbar({
            message: error.message || "Failed to add item to pantry",
            severity: "error",
          }),
        );
        // Don't close modal on error, let user try again
        setIsSubmitting(false);
      });
  };

  const handleClose = (modal_id) => {
    dispatch(toggleModal(modal_id));
  };

  return (
    <Modal
      modal_id="reviewItemModal"
      title="Add Item"
      buttons={[
        {
          text: "Cancel",
          variant: "outlined",
          onClick: () => handleClose("reviewItemModal"),
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
      <form className="review-item-form">
        {selectedItem.images && selectedItem.images.length > 0 && (
          <div className="review-item-image">
            <img
              src={selectedItem.images[0]}
              alt={selectedItem.title}
              className="review-item-image-content"
            />
          </div>
        )}

        <div className="review-item-form-group">
          <label htmlFor="title" className="review-item-form-label">
            Name <span className="review-item-text-danger">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            className={`review-item-form-control ${!formData.title ? "review-item-border-danger" : ""}`}
            value={formData.title}
            onChange={handleChange}
            required
          />
          {!formData.title && (
            <small className="review-item-text-danger">
              Product name is required
            </small>
          )}
        </div>

        <div className="review-item-form-group">
          <label htmlFor="amount" className="review-item-form-label">
            Amount <span className="review-item-text-danger">*</span>
          </label>
          <div className="review-item-input-group">
            <input
              type="number"
              id="amount"
              name="amount"
              className={`review-item-form-control ${!formData.amount ? "review-item-border-danger" : ""}`}
              value={formData.amount}
              onChange={handleChange}
              required
            />
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="review-item-form-select"
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
            <small className="review-item-text-danger">
              Quantity is required
            </small>
          )}
        </div>

        <div className="review-item-form-group">
          <label htmlFor="purchaseDate" className="review-item-form-label">
            Purchase Date
          </label>
          <input
            type="date"
            id="purchaseDate"
            name="purchaseDate"
            className="review-item-form-control"
            value={formData.purchaseDate}
            onChange={handleChange}
          />
        </div>

        <div className="review-item-form-group">
          <label htmlFor="expiryDate" className="review-item-form-label">
            Expiry Date
            <Tooltip title="Predicted based on item's predicted shelf life. Always refer to the item's Best By Date">
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
            className="review-item-form-control"
            value={formData.expiryDate}
            onChange={handleChange}
          />
        </div>
      </form>
    </Modal>
  );
};

export default ReviewItemModal;
