/* module utilsThisApp.js */

/**
 * @public
 * @function consoleColor
 * @description Used for console.log styling; defines text as bold
 * and sets color as specified
 * @param {string} color
 * @example
 * const color = "black";
 * consoleColor(color);
 * // => "color: black; font-weight: bold; font-size: 0.9rem;"
 * @returns {String} color and font configuration for console.log
 */
export const consoleColor = (color) => {
  return `color: ${color}; font-weight: bold; font-size: 0.9rem;`;
};

/**
 * @public
 * @function logApiCall
 * @param {Object} funcProps - function props
 * @param {string} funcProps.action - The action name
 * @param {string} funcProps.method - The HTTP method used
 * (i.e. "GET", "POST", etc.)
 * @param {string} funcProps.url - Url from api call
 * @param {Object} funcProps.tableObj - An object to be displayed as a table
 * @param {Array} funcProps.otherLogs - array of other logs
 * @example
 * const funcProps = { action: "getFacilities", method: "GET", url: "www.example.com" };
 * logApiCall(funcProps);
 */
export const logApiCall = (funcProps) => {
  const { action, method, url, tableObj, otherLogs } = funcProps;
  let color;
  switch (method) {
    case "GET":
      color = "blue";
      break;
    case "POST":
      color = "fuchsia";
      break;
    case "PUT":
      color = "purple";
      break;
    case "DEL":
      color = "crimson";
      break;
    case "PATCH":
      color = "tomato";
      break;
    case "LOCAL_STORAGE":
      color = "coral";
      break;
    default:
      color = "teal";
  }
  /* eslint-disable no-console */
  console.groupCollapsed(
    `%cAPI CALL > ${action} ${method ? `[${method}]` : ""}${
      url ? `: ${url}` : ""
    }`,
    consoleColor(color),
  );
  if (url) {
    console.trace(`%cURL: ${url}`, "font-weight: bold");
  }
  if (tableObj) {
    console.table(tableObj);
    console.info(JSON.stringify(tableObj));
  }
  if (otherLogs && otherLogs.length > 0) {
    otherLogs.forEach((log) => console.info(log));
  }

  console.groupEnd();
  /* eslint-enable no-console */
};

/**
 * @public
 * @function basicAPI
 * @description makes a fetch call to the given URL
 * @param {string} url - the URL to pass to fetch
 * @param {string} description - short description of the API action
 * @param {Object} fetchOptions - additional options to pass to fetch
 * @returns {Promise} the promise fetch returns
 */
export const basicAPI = (url, description, fetchOptions = {}) => {
  logApiCall({
    action: description,
    method: fetchOptions.method || "GET",
    url,
    tableObj: fetchOptions.body || null,
  });
  const useLocalApi = false;
  const thisUrl = useLocalApi ? url.replace("3000", "8443") : url;

  // Merge headers instead of overriding them
  const headers = { ...(fetchOptions.headers || {}) };

  // Set Content-Type header if body is provided and not already set
  if (fetchOptions.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  // Create a new fetchOptions object with the merged headers
  const updatedFetchOptions = {
    ...fetchOptions,
    headers,
  };

  console.log("API Request:", {
    url: thisUrl,
    method: updatedFetchOptions.method,
    headers: updatedFetchOptions.headers,
  });

  return fetch(thisUrl, updatedFetchOptions)
    .then(
      (response) => {
        console.log("API Response Status:", response.status);
        if (response.ok) {
          return response;
        }
        throw response;
      },
      (error) => {
        console.error("API Request Error:", error);
        throw error;
      },
    )
    .then((response) => {
      const contentType = response.headers?.get("Content-Type");
      if (contentType?.includes("application/json")) {
        return response.json();
      }
      return response;
    })
    .catch((e) => {
      if (!e || /JSON/.test(e.message)) {
        throw new Error("Received an invalid response from the server");
      }
      throw e;
    });
};
