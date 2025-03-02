/** @module recipeActions.js */

import { SET_RECIPES } from "../reducers/recipeReducer";

/**
 * @function setRecipes
 * @description sets (replaces) recipeState.recipes in store
 * @param {Array} products
 */
export const setRecipes = (recipes) => ({
  type: SET_RECIPES,
  payload: recipes,
});
