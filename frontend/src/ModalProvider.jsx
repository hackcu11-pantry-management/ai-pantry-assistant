/** @module ModalProvider.jsx */

import React from "react";
import { useDispatch } from "react-redux";

import Modal from "./common/Modal/Modal";
import { toggleModal } from "./redux/actions/modalActions";

import ScanItemModal from "./modals/ScanItemModal/ScanItemModal";

const ModalProvider = () => {
  const dispatch = useDispatch();

  const handleClose = (modal_id) => {
    dispatch(toggleModal(modal_id));
  };

  return (
    <>
      <Modal
        modal_id="addItemModal"
        title="Add Item"
        footerButtons={[
          {
            text: "Close",
            variant: "contained",
            onClick: () => handleClose("addItemModal"),
          },
        ]}
      >
        <p>This is the Add Item modal content.</p>
      </Modal>
      <ScanItemModal />
      {/* Add more modals here as needed */}
    </>
  );
};

export default ModalProvider;
