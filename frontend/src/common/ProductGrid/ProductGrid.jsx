/** @module ProductGrid.jsx */

import React from "react";

import "./ProductGrid.css";

const ProductCard = ({ item }) => {
  return (
    <div className="product-card">
      <img src={item.image} alt={item.name} className="product-image" />
      <h3 className="product-name">{item.name}</h3>
      <p className="product-expiry">Expiry: {item.expiry}</p>
    </div>
  );
};

const ProductGrid = ({ data }) => {
  return (
    <div className="product-grid">
      {data.map((item) => (
        <ProductCard key={item.id} item={item} />
      ))}
    </div>
  );
};

export default ProductGrid;
