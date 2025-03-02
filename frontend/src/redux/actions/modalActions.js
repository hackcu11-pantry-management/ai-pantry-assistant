/** @module modalActions.js */

import { TOGGLE_MODAL } from "../reducers/modalReducer";

/**
 * @function toggleModal
 * @description Toggles the modal state for a specific modal_id
 * @param {string} modal_id - The ID of the modal to toggle
 */
export const toggleModal = (modal_id) => ({
  type: TOGGLE_MODAL,
  payload: { modal_id },
});
