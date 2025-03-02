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

const Modal = ({ modal_id, title, children, buttons, style }) => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state) => state.modalState[modal_id]);

  const handleClose = () => {
    dispatch(toggleModal(modal_id));
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        style: {
          ...style,
          width: style?.width || "100%",
          maxWidth: style?.maxWidth || "600px",
          display: "flex",
          flexDirection: "column",
          height: "80vh",
        },
      }}
    >
      <DialogTitle sx={{ paddingBottom: 0 }}>
        {title}
        <Divider sx={{ marginTop: 1 }} />
      </DialogTitle>
      <DialogContent
        sx={{
          flex: "1 1 auto",
          overflowY: "auto",
        }}
      >
        {children}
      </DialogContent>
      <Divider sx={{ marginBottom: 1 }} />
      <DialogActions
        sx={{
          justifyContent: "flex-end",
          flexShrink: 0,
        }}
      >
        {(buttons ?? []).map(({ text, onClick, variant }, index) => (
          <Button
            key={index}
            variant={variant}
            onClick={onClick}
            sx={{
              marginLeft: 1,
              ...(text === "Cancel" && {
                backgroundColor: "#db584f",
                border: "none",
                color: "white",
                "&:hover": {
                  backgroundColor: "darkred",
                },
              }),
              ...(text === "Save" && {
                backgroundColor: "#3498db",
                border: "none",
                color: "white",
                "&:hover": {
                  backgroundColor: "#2980b9",
                },
              }),
            }}
          >
            {text}
          </Button>
        ))}
      </DialogActions>
    </Dialog>
  );
};

export default Modal;
