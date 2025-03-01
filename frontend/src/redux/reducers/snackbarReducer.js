/** @module snackbarReducer.js */

export const ADD_SNACKBAR = "ADD_SNACKBAR";
export const REMOVE_SNACKBAR = "REMOVE_SNACKBAR";

export const defaultState = {
  open: false,
  message: "",
  severity: "info",
};

const snackbarState = (state = defaultState, action) => {
  const { type, payload } = action;
  switch (type) {
    case ADD_SNACKBAR:
      return { ...state, ...payload, open: true };
    case REMOVE_SNACKBAR:
      return { defaultState };
    default:
      return state;
  }
};

export default snackbarState;
