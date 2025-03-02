/** @module ScanItemModal */

import React from "react";
import { useDispatch } from "react-redux";
import { toggleModal } from "../../redux/actions/modalActions";
import Modal from "../../common/Modal/Modal";
import BarcodeScanner from "./BarcodeScanner";

const ScanItemModal = () => {
  const dispatch = useDispatch();

  const handleClose = (modal_id) => {
    dispatch(toggleModal(modal_id));
  };

  return (
    <Modal
      modal_id="scanItemModal"
      title="Scan Item"
      footerButtons={[
        {
          text: "Close",
          variant: "contained",
          onClick: () => handleClose("scanItemModal"),
        },
      ]}
    >
      <BarcodeScanner />
    </Modal>
  );
};

export default ScanItemModal;
