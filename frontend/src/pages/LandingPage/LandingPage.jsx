/** @module LandingPage.jsx */

import React from "react";
import { useDispatch } from "react-redux";

import { Card, CardHeader, DetailLine, ProductGrid } from "../../common";
import { toggleModal } from "../../redux/actions/modalActions";

import "./LandingPage.css";

const items = [
  {
    id: 1,
    name: "Milk",
    expiry: "2-28",
    image: "data:image/jpeg;base64,...",
  },
  {
    id: 2,
    name: "Eggs",
    expiry: "3-05",
    image: "data:image/jpeg;base64,...",
  },
  { id: 3, name: "Cheese", expiry: "3-15", image: "/images/cheese.png" },
];

const LandingPage = () => {
  const dispatch = useDispatch();

  const handleOpenModal = (modal_id) => {
    dispatch(toggleModal(modal_id));
  };

  return (
    <div className="page-container">
      <Card>
        <CardHeader
          text="Pantry Items"
          buttons={[
            {
              text: "Add Item",
              onClick: () => handleOpenModal("addItemModal"),
              variant: "contained",
            },
            {
              text: "Remove Item",
              onClick: () => handleOpenModal("removeItemModal"),
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
