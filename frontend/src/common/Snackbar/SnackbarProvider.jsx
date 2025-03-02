/** @module SnackbarProvider.jsx */

import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { Snackbar, Alert } from "@mui/material";
import { removeSnackbar } from "../../redux/actions/snackbarActions";

const SnackbarProvider = () => {
  const dispatch = useDispatch();
  const {
    open,
    message,
    severity,
    autoHideDuration = 6000,
  } = useSelector((state) => state.snackbarState);

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    dispatch(removeSnackbar({}));
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert
        onClose={handleClose}
        severity={severity}
        variant="filled"
        sx={{ width: "100%" }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default SnackbarProvider;
