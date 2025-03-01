/** @module DetailLine.jsx */

import React from "react";

import "./DetailLine.css";

const DetailLine = ({ title }) => {
  return (
    <div className="detail-line">
      <span>{title}</span>
      <div className="line" />
    </div>
  );
};

export default DetailLine;
