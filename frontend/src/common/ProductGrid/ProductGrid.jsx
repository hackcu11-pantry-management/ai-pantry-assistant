/** @module ProductGrid.jsx */

import React from "react";
import { useDispatch } from "react-redux";
import DeleteIcon from "@mui/icons-material/Delete";
import { toggleModal } from "../../redux/actions/modalActions";
import { selectProduct } from "../../redux/actions/productActions";

import "./ProductGrid.css";

const ProductCard = ({ item, onItemClick }) => {
  const dispatch = useDispatch();

  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Prevent triggering the card click
    dispatch(selectProduct(item));
    dispatch(toggleModal("deleteConfirmationModal"));
  };

  return (
    <div className="product-card" onClick={() => onItemClick(item)}>
      <div className="delete-icon-container" onClick={handleDeleteClick}>
        <DeleteIcon className="delete-icon" />
      </div>
      <img src={item.image} alt={item.name} className="product-image" />
      <h3 className="product-name">{item.name}</h3>
      {item.quantity && <p className="product-quantity">{item.quantity}</p>}
      <p className="product-expiry">Expiry: {item.expiry}</p>
    </div>
  );
};

const ProductGrid = ({ data, onItemClick }) => {
  return (
    <div className="product-grid">
      {data.map((item) => (
        <ProductCard key={item.id} item={item} onItemClick={onItemClick} />
      ))}
    </div>
  );
};

export default ProductGrid;
