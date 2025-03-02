/** @module userActions.js */

import {
  ADD_LOGIN_AUTHENTICATION,
  ADD_USER_PREFERENCES,
} from "../reducers/userReducer";
import { API_URL } from "../../data/constants";
import { basicAPI } from "../../utils/utilsThisApp";
import { addSnackbar } from "./snackbarActions";

/**
 * @function addLoginAuthentication
 * @description sets (replaces) userState.loginResults in store
 * @param {Object} results
 */
export const addLoginAuthentication = (results) => ({
  type: ADD_LOGIN_AUTHENTICATION,
  payload: results,
});

/**
 * @function addUserPreferences
 * @description sets (replaces) userState.userPreferences in store
 * @param {Object} results
 */
export const addUserPreferences = (results) => ({
  type: ADD_USER_PREFERENCES,
  payload: results,
});

/**
 * @function login
 * @description Makes API call to login a user
 * @param {Object} loginData
 */
export const login = (loginData) => (dispatch) => {
  const url = `${API_URL}/login`;

  return basicAPI(url, "login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loginData),
  })
    .then((response) => {
      console.log("Login response:", response);
      if (response.success) {
        const userData = {
          userID: response.userID,
          token: response.token,
          username: response.username,
          userFirstName: response.userFirstName,
          userLastName: response.userLastName,
        };
        console.log("Setting user data in store:", {
          ...userData,
          token: userData.token ? "Token exists" : "No token",
        });
        dispatch(addLoginAuthentication(userData));
        dispatch(
          addSnackbar({
            message: "Login successful",
            severity: "success",
          }),
        );
      } else {
        dispatch(
          addSnackbar({
            message: response.error || "Login failed",
            severity: "error",
          }),
        );
      }
      return response;
    })
    .catch((error) => {
      dispatch(
        addSnackbar({
          message: error.message || "Login failed",
          severity: "error",
        }),
      );
      throw error;
    });
};

/**
 * @function signup
 * @description Makes API call to register a new user
 * @param {Object} signupData
 */
export const signup = (signupData) => (dispatch) => {
  const url = `${API_URL}/signup`;

  return basicAPI(url, "signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(signupData),
  })
    .then((response) => {
      if (response.success) {
        const userData = {
          userID: response.userID,
          token: response.token,
          username: response.username,
        };
        dispatch(addLoginAuthentication(userData));
        dispatch(
          addSnackbar({
            message: "Signup successful",
            severity: "success",
          }),
        );
      } else {
        dispatch(
          addSnackbar({
            message: response.error || "Signup failed",
            severity: "error",
          }),
        );
      }
      return response;
    })
    .catch((error) => {
      dispatch(
        addSnackbar({
          message: error.message || "Signup failed",
          severity: "error",
        }),
      );
      throw error;
    });
};

/**
 * @function logout
 * @description Logs out the user by clearing the authentication state
 */
export const logout = () => (dispatch) => {
  dispatch(addLoginAuthentication(null));
  dispatch(
    addSnackbar({
      message: "Logged out successfully",
      severity: "success",
    }),
  );
};
