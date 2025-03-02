/** @module DeleteConfirmationModal.jsx */

import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal } from "../common";
import { toggleModal } from "../redux/actions/modalActions";
import { removePantryItem } from "../redux/actions/productActions";
import { addSnackbar } from "../redux/actions/snackbarActions";

const DeleteConfirmationModal = () => {
  const dispatch = useDispatch();
  const [isDeleting, setIsDeleting] = useState(false);
  const selectedProduct = useSelector((state) => state.productState.selected);

  const handleClose = () => {
    dispatch(toggleModal("deleteConfirmationModal"));
  };

  const handleDelete = async () => {
    if (!selectedProduct || !selectedProduct.id) {
      dispatch(
        addSnackbar({
          message: "No item selected for deletion",
          severity: "error",
        }),
      );
      return;
    }

    setIsDeleting(true);
    try {
      await dispatch(removePantryItem(selectedProduct.id));
      handleClose();
    } catch (error) {
      console.error("Failed to delete item:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Button styles
  const buttonStyle = {
    padding: "8px 16px",
    fontSize: "16px",
    margin: "0 8px",
  };

  const deleteButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#dc3545",
    borderColor: "#dc3545",
    color: "white",
    transition: "background-color 0.2s ease",
  };

  const cancelButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#6c757d",
    borderColor: "#6c757d",
    color: "white",
    transition: "background-color 0.2s ease",
  };

  // Hover handlers
  const handleDeleteHover = (e, isHover) => {
    e.target.style.backgroundColor = isHover ? "#c82333" : "#dc3545";
    e.target.style.borderColor = isHover ? "#bd2130" : "#dc3545";
  };

  const handleCancelHover = (e, isHover) => {
    e.target.style.backgroundColor = isHover ? "#5a6268" : "#6c757d";
    e.target.style.borderColor = isHover ? "#545b62" : "#6c757d";
  };

  // Custom footer with our buttons
  const renderFooter = () => (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "12px",
        marginTop: "1rem",
      }}
    >
      <button
        className="btn"
        onClick={handleClose}
        disabled={isDeleting}
        style={cancelButtonStyle}
        onMouseEnter={(e) => handleCancelHover(e, true)}
        onMouseLeave={(e) => handleCancelHover(e, false)}
      >
        Cancel
      </button>
      <button
        className="btn"
        onClick={handleDelete}
        disabled={isDeleting}
        style={deleteButtonStyle}
        onMouseEnter={(e) => handleDeleteHover(e, true)}
        onMouseLeave={(e) => handleDeleteHover(e, false)}
      >
        {isDeleting ? "Deleting..." : "Delete Item"}
      </button>
    </div>
  );

  return (
    <Modal
      modal_id="deleteConfirmationModal"
      title="Delete Item"
      footerButtons={[]}
      style={{ maxWidth: "400px" }}
    >
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <p style={{ fontSize: "18px", marginBottom: "20px" }}>
          Are you sure you want to delete this item?
        </p>
        {selectedProduct && (
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: "bold" }}>
              {selectedProduct.name}
            </h3>
            <p>{selectedProduct.quantity}</p>
          </div>
        )}
        {renderFooter()}
      </div>
    </Modal>
  );
};

export default DeleteConfirmationModal;
