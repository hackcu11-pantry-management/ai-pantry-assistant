/** @module DetailLine.jsx */

import React from "react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

import "./DetailLine.css";

const DetailLine = ({ title, isCollapsed, onToggleCollapse }) => {
  return (
    <div className="detail-line">
      <div className="title-container" onClick={onToggleCollapse}>
        <KeyboardArrowDownIcon 
          className={`chevron-icon ${isCollapsed ? 'rotated' : ''}`} 
        />
        <span>{title}</span>
      </div>
      <div className="line" />
    </div>
  );
};

export default DetailLine;
