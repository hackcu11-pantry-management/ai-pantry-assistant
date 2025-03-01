import React from "react";
import CardHeader from "../CardHeader/CardHeader";

import "./Card.css";

const Card = ({ children }) => {
  // Extract CardHeader and all other children
  const header = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.type === CardHeader,
  );

  // Filter out CardHeader children and wrap others in body-container
  const bodyChildren = React.Children.toArray(children).filter(
    (child) => !(React.isValidElement(child) && child.type === CardHeader),
  );

  return (
    <div className="card-container">
      {header}
      <div className="body-container">{bodyChildren}</div>
    </div>
  );
};

export default Card;
