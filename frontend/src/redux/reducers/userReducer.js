/** @module userReducer.js */

export const ADD_LOGIN_AUTHENTICATION = "ADD_LOGIN_AUTHENTICATION";
export const ADD_USER_PREFERENCES = "ADD_USER_PREFERENCES";

export const defaultState = {
  loginResult: false,
  userPreferences: {},
};

const userState = (state = defaultState, action) => {
  const { type, payload } = action;
  switch (type) {
    case ADD_LOGIN_AUTHENTICATION:
      return { ...state, loginResult: payload };
    case ADD_USER_PREFERENCES:
      return { ...state, userPreferences: payload };
    default:
      return state;
  }
};

export default userState;
