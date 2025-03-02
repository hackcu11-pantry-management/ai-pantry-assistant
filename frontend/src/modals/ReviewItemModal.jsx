/** @module ReviewItemModal.jsx */

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal } from "../common";
import { toggleModal } from "../redux/actions/modalActions";

const ReviewItemModal = () => {
  const dispatch = useDispatch();
  const selectedItem = useSelector((state) => state.productState?.selected) ?? {};

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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClose = (modal_id) => {
    dispatch(toggleModal(modal_id));
  };

  return (
    <Modal
      modal_id="reviewItemModal"
      title="Add Item"
      footerButtons={[
        {
          text: "Cancel",
          variant: "outlined",
          onClick: () => handleClose("reviewItemModal"),
        },
        {
          text: "Save",
          variant: "contained",
          onClick: () => console.log("Submit functionality to be implemented"),
        },
      ]}
    >
      <form className="product-form">
        {selectedItem.images && selectedItem.images.length > 0 && (
          <div className="product-image mb-4">
            <img
              src={selectedItem.images[0]}
              alt={selectedItem.title}
              style={{ maxWidth: "200px" }}
            />
          </div>
        )}
        
        <div className="form-group mb-3">
          <label htmlFor="title" className="form-label">Name</label>
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
          <label htmlFor="amount" className="form-label">Amount</label>
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
          <label htmlFor="purchaseDate" className="form-label">Purchase Date</label>
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
          <label htmlFor="expiryDate" className="form-label">Expiry Date</label>
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

export default ReviewItemModal;
