/** @module ReviewItemModal.jsx */

import React from "react";

import { useDispatch, useSelector } from "react-redux";

import { Modal } from "../common";
import { toggleModal } from "../redux/actions/modalActions";

const ReviewItemModal = () => {
  const dispatch = useDispatch();

  const selectedItem =
    useSelector((state) => state.productState?.selected) ?? {};

  const handleClose = (modal_id) => {
    dispatch(toggleModal(modal_id));
  };

  console.log(selectedItem);
  return (
    <Modal
      modal_id="reviewItemModal"
      title="Review"
      footerButtons={[
        {
          text: "Close",
          variant: "contained",
          onClick: () => handleClose("reviewItemModal"),
        },
      ]}
    >
      {selectedItem && (
        <div className="product-info">
          <h3>Product Information:</h3>
          <div className="product-details">
            <p>
              <strong>Name:</strong> {selectedItem.title}
            </p>
            <p>
              <strong>Brand:</strong> {selectedItem.brand}
            </p>
            <p>
              <strong>Category:</strong> {selectedItem.category}
            </p>
            {selectedItem.size && (
              <p>
                <strong>Size:</strong> {selectedItem.size}
              </p>
            )}
            {selectedItem.weight && (
              <p>
                <strong>Weight:</strong> {selectedItem.weight}
              </p>
            )}
            {selectedItem.color && (
              <p>
                <strong>Color:</strong> {selectedItem.color}
              </p>
            )}
            {selectedItem.model && (
              <p>
                <strong>Model:</strong> {selectedItem.model}
              </p>
            )}
            {selectedItem.dimension && (
              <p>
                <strong>Dimensions:</strong> {selectedItem.dimension}
              </p>
            )}
            {(selectedItem.lowest_recorded_price > 0 ||
              selectedItem.highest_recorded_price > 0) && (
              <p>
                <strong>Price Range:</strong> {selectedItem.currency || "$"}
                {selectedItem.lowest_recorded_price} -{" "}
                {selectedItem.highest_recorded_price}
              </p>
            )}
            {selectedItem.offers && selectedItem.offers.length > 0 && (
              <div>
                <strong>Current Offers:</strong>
                <ul className="mt-2">
                  {selectedItem.offers.slice(0, 3).map((offer, index) => (
                    <li key={index} className="text-sm mb-1">
                      {offer.merchant}: ${offer.price}
                      {offer.shipping && ` + ${offer.shipping} shipping`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p>
              <strong>Description:</strong> {selectedItem.description}
            </p>
          </div>
          {selectedItem.images && selectedItem.images.length > 0 && (
            <div className="product-image">
              <img
                src={selectedItem.images[0]}
                alt={selectedItem.title}
                style={{ maxWidth: "200px", marginTop: "10px" }}
              />
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default ReviewItemModal;
