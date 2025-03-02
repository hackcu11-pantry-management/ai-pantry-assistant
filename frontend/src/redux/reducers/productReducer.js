/** @module productReducer */

export const SET_PRODUCTS = "SET_PRODUCTS";
export const SELECT_PRODUCT = "SELECT_PRODUCT";

export const defaultState = {
  products: [],
  selected: {},
};

const productReducer = (state = defaultState, action) => {
  const { type, payload } = action;
  switch (type) {
    case SET_PRODUCTS:
      return { ...state, products: payload };
    case SELECT_PRODUCT:
      return { ...state, selected: payload };
    default:
      return state;
  }
};

export default productReducer;
