import React from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Button,
} from "@mui/material";
import { toggleModal } from "../../redux/actions/modalActions";

const Modal = ({ modal_id, title, children, footerButtons }) => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state) => state.modalState[modal_id]);

  const handleClose = () => {
    dispatch(toggleModal(modal_id));
  };

  return (
    <Dialog open={isOpen} onClose={handleClose}>
      <DialogTitle>
        {title}
        <Divider sx={{ marginTop: 1 }} />
      </DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions sx={{ justifyContent: "flex-end" }}>
        {footerButtons.map((button, index) => (
          <Button
            key={index}
            variant={button.variant}
            onClick={button.onClick}
            sx={{ marginLeft: 1 }}
          >
            {button.text}
          </Button>
        ))}
      </DialogActions>
    </Dialog>
  );
};

export default Modal;
