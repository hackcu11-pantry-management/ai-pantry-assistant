/** @module ReviewItemModal.jsx */

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal } from "../common";
import { toggleModal } from "../redux/actions/modalActions";
import { addToPantry } from "../redux/actions/productActions";

import Tooltip from "@mui/material/Tooltip";
import InfoIcon from "@mui/icons-material/Info";

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
    const payload = {
      productUPC: String(selectedItem.upc || ""), // Ensure UPC is always a string
      quantity: Number(formData.amount) || 1,
      quantityType: formData.unit,
      date_purchased: formData.purchaseDate,
      expiration_date: formData.expiryDate,
    };

    if (payload.productUPC && payload.quantity) {
      console.log("payload", payload);
      setIsSubmitting(true);
      dispatch(addToPantry(payload))
        .then(() => {
          handleClose("reviewItemModal");
        })
        .catch((error) => {
          console.error("Failed to add item to pantry:", error);
        })
        .finally(() => {
          setIsSubmitting(false);
        });
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
        onClick={() => handleClose("reviewItemModal")}
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
      modal_id="reviewItemModal"
      title="Add Item"
      footerButtons={[]}
      style={modalStyles}
    >
      <form className="product-form" style={{ width: '100%' }}>
        {selectedItem.images && selectedItem.images.length > 0 && (
          <div className="text-center mb-4">
            <img
              src={selectedItem.images[0]}
              alt={selectedItem.title}
              style={{ maxWidth: '150px', maxHeight: '150px' }}
              className="img-thumbnail"
            />
          </div>
        )}

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
          />
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

export default ReviewItemModal;
