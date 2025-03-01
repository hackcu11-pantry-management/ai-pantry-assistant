/** @module configureStore.js */

import { configureStore } from "@reduxjs/toolkit";
import { createLogger } from "redux-logger";

import userState from "./reducers/userReducer";
import snackbarState from "./reducers/snackbarReducer";
import productState from "./reducers/productReducer";

const logger = createLogger({ collapsed: true, diff: true });

const store = configureStore({
  reducer: {
    userState,
    snackbarState,
    productState,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger),
});

export default store;
