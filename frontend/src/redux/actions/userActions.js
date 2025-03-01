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
 * @param {Array} results
 */
export const addLoginAuthentication = (results) => ({
  type: ADD_LOGIN_AUTHENTICATION,
  payload: results,
});

/**
 * @function addUserPreferences
 * @description sets (replaces) userState.userPreferences in store
 * @param {Array} results
 */
export const addUserPreferences = (results) => ({
  type: ADD_USER_PREFERENCES,
  payload: results,
});

/**
 * @function getLoginAuthentication
 * @description Makes API call to get user authentication results.
 * @param {Object} loginForm
 */
export const getLoginAuthentication = (loginForm) => (dispatch) => {
  const url = `${API_URL}/user/authenticate/login?username=${loginForm?.username ?? ""}&password=${loginForm?.password ?? ""}`;

  return basicAPI(url, "getUserLogin")
    .then((response) => {
      dispatch(addLoginAuthentication(response?.data?.loginResult));
      if (response?.data?.userPreferences) {
        dispatch(addUserPreferences(response?.data?.userPreferences));
      }
      return response;
    })
    .then((response) => {
      dispatch(
        addSnackbar({
          message: response?.message,
          severity: response?.status === 200 ? "success" : "error",
        }),
      );
      return response;
    })
    .catch((error) => {
      console.error("Error: ", error);
      return error;
    });
};

/**
 * @function registerUser
 * @description Makes API call to register user.
 * @param {Object} loginForm
 */
export const registerUser = (registerForm) => (dispatch) => {
  const method = "POST";
  const url = `${API_URL}/user/authenticate/register`;

  const fetchObj = {
    method,
    body: JSON.stringify(registerForm),
  };

  return basicAPI(url, "registerUser", fetchObj)
    .then((response) => {
      // render snackbars
      if (response?.status === 200) {
        dispatch(
          addSnackbar({
            message: response?.message,
            severity: "success",
          }),
        );
        return response;
      }
      // TODO: replace error snackbars with form validation!
      //       also make sure that we enforce user and password lengths
      if (response?.data?.code === "23505") {
        dispatch(
          addSnackbar({
            message: "Username taken. Register with a different username.",
            severity: "error",
          }),
        );
        return response;
      }
      if (response?.data?.code === "22001") {
        dispatch(
          addSnackbar({
            message: "Username cannot be larger than 50 characters.",
            severity: "error",
          }),
        );
        return response;
      }

      return response;
    })
    .catch((error) => {
      // server error
      console.error("Error: ", error);
      return error;
    });
};
