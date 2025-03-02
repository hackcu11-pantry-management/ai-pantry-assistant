/** @module recipeReducer.js */

export const SET_RECIPES = "SET_RECIPES";

export const defaultState = {
  recipes: [],
};

const recipeState = (state = defaultState, action) => {
  const { type, payload } = action;
  switch (type) {
    case SET_RECIPES:
      return { ...state, recipes: payload };
    default:
      return state;
  }
};

export default recipeState;
