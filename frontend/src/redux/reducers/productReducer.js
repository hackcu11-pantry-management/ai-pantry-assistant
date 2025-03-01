/** @module productReducer */

export const SET_PRODUCTS = "SET_PRODUCTS";

export const defaultState = {
  products: [],
};

const productReducer = (state = defaultState, action) => {
  const { type, payload } = action;
  switch (type) {
    case SET_PRODUCTS:
      return { ...state, products: payload };
    default:
      return state;
  }
};

export default productReducer;
