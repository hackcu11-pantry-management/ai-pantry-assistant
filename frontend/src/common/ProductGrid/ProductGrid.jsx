/** @module ProductGrid.jsx */

import React from "react";

import "./ProductGrid.css";

const ProductCard = ({ item, onItemClick }) => {
  return (
    <div className="product-card" onClick={() => onItemClick(item)}>
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
