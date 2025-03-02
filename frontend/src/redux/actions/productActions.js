/** @module productActions.js */

import { SELECT_PRODUCT, SET_PRODUCTS } from "../reducers/productReducer";
import { API_URL } from "../../data/constants";
import { basicAPI } from "../../utils/utilsThisApp";
import { addSnackbar } from "./snackbarActions";

/**
 * @function setProducts
 * @description sets (replaces) productState.products in store
 * @param {Array} products
 */
export const setProducts = (products) => ({
  type: SET_PRODUCTS,
  payload: products,
});

/**
 * @function selectProduct
 * @description sets (replaces) productState.selected in store
 * @param {Array} products
 */
export const selectProduct = (products) => ({
  type: SELECT_PRODUCT,
  payload: products,
});

/**
 * @function addProduct
 * @description Makes API call to add a product to the database
 * @param {Object} productData
 */
export const addProduct = (productData) => (dispatch, getState) => {
  const token = getState().userState.loginResult?.token;

  if (!token) {
    dispatch(
      addSnackbar({
        message: "You must be logged in to add products",
        severity: "error",
      }),
    );
    return Promise.reject("Not authenticated");
  }

  const url = `${API_URL}/products`;

  return basicAPI(url, "addProduct", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(productData),
  })
    .then((response) => {
      dispatch(
        addSnackbar({
          message: "Product added successfully",
          severity: "success",
        }),
      );
      return response;
    })
    .catch((error) => {
      dispatch(
        addSnackbar({
          message: error.message || "Failed to add product",
          severity: "error",
        }),
      );
      throw error;
    });
};

/**
 * @function addToPantry
 * @description Makes API call to add a product to the user's pantry
 * @param {Object} pantryData
 */
export const addToPantry = (pantryData) => (dispatch, getState) => {
  const token = getState().userState.loginResult?.token;

  if (!token) {
    dispatch(
      addSnackbar({
        message: "You must be logged in to add to pantry",
        severity: "error",
      }),
    );
    return Promise.reject("Not authenticated");
  }

  const url = `${API_URL}/pantry`;

  return basicAPI(url, "addToPantry", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(pantryData),
  })
    .then((response) => {
      dispatch(
        addSnackbar({
          message: "Product added to pantry",
          severity: "success",
        }),
      );
      return response;
    })
    .catch((error) => {
      dispatch(
        addSnackbar({
          message: error.message || "Failed to add product to pantry",
          severity: "error",
        }),
      );
      throw error;
    });
};

/**
 * @function getUserPantry
 * @description Makes API call to get the user's pantry items
 */
export const getUserPantry = () => (dispatch, getState) => {
  const token = getState().userState.loginResult?.token;

  if (!token) {
    dispatch(
      addSnackbar({
        message: "You must be logged in to view your pantry",
        severity: "error",
      }),
    );
    return Promise.reject("Not authenticated");
  }

  const url = `${API_URL}/pantry`;

  return basicAPI(url, "getUserPantry", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => {
      dispatch(setProducts(response.data.pantry_items || []));
      return response;
    })
    .catch((error) => {
      dispatch(
        addSnackbar({
          message: error.message || "Failed to get pantry items",
          severity: "error",
        }),
      );
      throw error;
    });
};

/**
 * @function updatePantryItem
 * @description Makes API call to update a pantry item
 * @param {number} pantryId
 * @param {Object} updateData
 */
export const updatePantryItem =
  (pantryId, updateData) => (dispatch, getState) => {
    const token = getState().userState.loginResult?.token;

    if (!token) {
      dispatch(
        addSnackbar({
          message: "You must be logged in to update pantry items",
          severity: "error",
        }),
      );
      return Promise.reject("Not authenticated");
    }

    const url = `${API_URL}/pantry/${pantryId}`;

    return basicAPI(url, "updatePantryItem", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    })
      .then((response) => {
        dispatch(
          addSnackbar({
            message: "Pantry item updated",
            severity: "success",
          }),
        );
        // Refresh pantry after update
        dispatch(getUserPantry());
        return response;
      })
      .catch((error) => {
        dispatch(
          addSnackbar({
            message: error.message || "Failed to update pantry item",
            severity: "error",
          }),
        );
        throw error;
      });
  };

/**
 * @function removePantryItem
 * @description Makes API call to remove a pantry item
 * @param {number} pantryId
 */
export const removePantryItem = (pantryId) => (dispatch, getState) => {
  const token = getState().userState.loginResult?.token;

  if (!token) {
    dispatch(
      addSnackbar({
        message: "You must be logged in to remove pantry items",
        severity: "error",
      }),
    );
    return Promise.reject("Not authenticated");
  }

  const url = `${API_URL}/pantry/${pantryId}`;

  return basicAPI(url, "removePantryItem", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => {
      dispatch(
        addSnackbar({
          message: "Item removed from pantry",
          severity: "success",
        }),
      );
      // Refresh pantry after removal
      dispatch(getUserPantry());
      return response;
    })
    .catch((error) => {
      dispatch(
        addSnackbar({
          message: error.message || "Failed to remove pantry item",
          severity: "error",
        }),
      );
      throw error;
    });
};

/**
 * @function getPantryIdByUserAndProduct
 * @description Makes API call to get the pantryID for a specific user and product
 * @param {number} userId
 * @param {string} productUpc
 */
export const getPantryIdByUserAndProduct =
  (userId, productUpc) => (dispatch, getState) => {
    const token = getState().userState.loginResult?.token;

    if (!token) {
      dispatch(
        addSnackbar({
          message: "You must be logged in to access pantry information",
          severity: "error",
        }),
      );
      return Promise.reject("Not authenticated");
    }

    const url = `${API_URL}/pantry/user/${userId}/product/${productUpc}`;

    return basicAPI(url, "getPantryIdByUserAndProduct", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).catch((error) => {
      dispatch(
        addSnackbar({
          message: error.message || "Failed to get pantry information",
          severity: "error",
        }),
      );
      throw error;
    });
  };
