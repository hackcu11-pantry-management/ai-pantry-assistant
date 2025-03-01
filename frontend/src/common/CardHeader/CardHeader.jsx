/** @module CardHeader.jsx */

import React from "react";

import { Button } from "../../common";

import "./CardHeader.css";

const CardHeader = ({ text, buttons }) => {
  return (
    <div className="card-header">
      <div className="header-text">{text}</div>
      <div className="header-buttons">
        {(buttons ?? []).map(({ text, onClick, variant }, index) => (
          <Button key={index} variant={variant} onClick={onClick}>
            {text}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default CardHeader;
