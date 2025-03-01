import React from "react";
import { Button as MuiButton } from "@mui/material";

const Button = (props) => {
  const { children, hasShadow = false, onClick, variant = "contained" } = props;

  const commonStyles = {
    padding: "0.5rem 1rem",
    borderRadius: "0.5rem",
    transition: "background-color 0.3s",
    textTransform: "none",
    whiteSpace: "nowrap",
  };

  const containedStyles = {
    ...commonStyles,
    border: "none",
    backgroundColor: "#3498db",
    color: "white",
    "&:hover": {
      backgroundColor: "#2980b9",
    },
  };

  const outlinedStyles = {
    ...commonStyles,
    border: "1px solid white",
    backgroundColor: "transparent",
    color: "white",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
  };

  const buttonStyles =
    variant === "contained" ? containedStyles : outlinedStyles;

  return (
    <MuiButton
      onClick={onClick}
      variant={variant}
      disableElevation={!hasShadow}
      sx={buttonStyles}
    >
      {children}
    </MuiButton>
  );
};

export default Button;
