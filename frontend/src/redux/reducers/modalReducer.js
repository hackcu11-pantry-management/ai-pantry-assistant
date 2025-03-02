/** @module modalReducer.js */

export const TOGGLE_MODAL = "TOGGLE_MODAL";

export const defaultState = {};

const modalReducer = (state = defaultState, action) => {
  switch (action.type) {
    case TOGGLE_MODAL:
      const { modal_id } = action.payload;
      return { ...state, [modal_id]: !state[modal_id] };
    default:
      return state;
  }
};

export default modalReducer;
