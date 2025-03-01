/** @module snackbarActions.js */

import { ADD_SNACKBAR, REMOVE_SNACKBAR } from "../reducers/snackbarReducer";

/**
 * @function addSnackbar
 * @description functional display for snackbar
 * @param {Object} snackbarObj
 */
export const addSnackbar = (snackbarObj) => {
  return {
    type: ADD_SNACKBAR,
    payload: snackbarObj,
  };
};

/**
 * @function removeSnackbar
 * @description close and clear snackbarState
 * @param {Object} snackbarObj
 */
export const removeSnackbar = (snackbarObj) => {
  return {
    type: REMOVE_SNACKBAR,
    payload: snackbarObj,
  };
};
