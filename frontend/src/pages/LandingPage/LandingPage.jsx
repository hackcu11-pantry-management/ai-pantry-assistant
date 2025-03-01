/** @module LandingPage.jsx */

import React from "react";
import { Card, CardHeader, DetailLine, ProductGrid } from "../../common";

import "./LandingPage.css";

const items = [
  { id: 1, name: "Milk", expiry: "2-28", image: "/images/milk.png" },
  { id: 2, name: "Eggs", expiry: "3-05", image: "/images/eggs.png" },
  { id: 3, name: "Cheese", expiry: "3-15", image: "/images/cheese.png" },
];

const LandingPage = () => {
  return (
    <div className="page-container">
      <Card>
        <CardHeader
          text="Pantry Items"
          buttons={[
            {
              text: "Add Item",
              onClick: () => console.log("Add Item clicked"),
              variant: "contained",
            },
            {
              text: "Remove Item",
              onClick: () => console.log("Remove Item clicked"),
              variant: "contained",
            },
          ]}
        />
        <DetailLine title="Dairy" />
        <ProductGrid data={items} />
        <DetailLine title="Meats" />
      </Card>
    </div>
  );
};

export default LandingPage;
