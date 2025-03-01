/** @module LandingPage.jsx */

import React from "react";

import { Card, CardHeader } from "../../common";
import "./LandingPage.css";

const LandingPage = () => {
  return (
    <div className="page-container">
      <Card>
        <CardHeader
          text="Pantry Items"
          buttons={[
            {
              text: "Add Item",
              onClick: () => console.log("button clicked"),
              variant: "contained",
            },
            {
              text: "Remove Item",
              onClick: () => console.log("2button clicked"),
              variant: "contained",
            },
          ]}
        />
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
        velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
        occaecat cupidatat non proident, sunt in culpa qui officia deserunt
        mollit anim id est laborum.
      </Card>
    </div>
  );
};

export default LandingPage;
