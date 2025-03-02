import React, { useState } from "react";
import { API_URL } from "../data/constants";
const ExamplePage = () => {
  const [upc, setUpc] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchInfo, setSearchInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setSearchInfo(null);

    try {
      const response = await fetch(
        `${API_URL}/lookup-upc?upc=${encodeURIComponent(upc)}`,
      );
      const data = await response.json();

      if (data.success) {
        setResult(data.items);
        setSearchInfo({
          source: data.source,
          cached: data.cached,
          details: data.details,
        });
      } else {
        setError({
          message: data.error,
          status: data.status,
          details: data.details,
        });
      }
    } catch (err) {
      setError({
        message: "Failed to connect to server",
        status: "CONNECTION_ERROR",
        details: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const renderSearchInfo = () => {
    if (!searchInfo) return null;

    return (
      <div className="text-sm text-gray-600 mb-4">
        <span className="font-medium">Source: </span>
        <span className="capitalize">{searchInfo.source}</span>
        {searchInfo.cached !== undefined && (
          <>
            <span className="mx-2">•</span>
            <span className="font-medium">Cached: </span>
            <span>{searchInfo.cached ? "Yes" : "No"}</span>
          </>
        )}
        {searchInfo.details && (
          <>
            <span className="mx-2">•</span>
            <span className="font-medium">Note: </span>
            <span>{searchInfo.details}</span>
          </>
        )}
      </div>
    );
  };

  const renderError = () => {
    if (!error) return null;

    const errorMessages = {
      VALIDATION_ERROR: "Please provide a valid UPC code.",
      DB_ERROR: "Database is currently unavailable.",
      API_ERROR: "External service is currently unavailable.",
      NOT_FOUND: "No product found with this UPC code.",
      SERVER_ERROR: "Server encountered an error.",
      CONNECTION_ERROR: "Could not connect to server.",
    };

    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
        <div className="font-medium">
          {errorMessages[error.status] || error.message}
        </div>
        {error.details && (
          <div className="text-sm mt-1 text-red-600">{error.details}</div>
        )}
      </div>
    );
  };

  const renderProductInfo = (item) => {
    return (
      <div
        key={item.productupc || item.upc}
        className="border rounded-lg p-4 mb-4 shadow-sm"
      >
        <h2 className="text-xl font-semibold mb-2">
          {item.productname || item.title}
        </h2>
        {(item.productimages || item.images) &&
          (item.productimages || item.images).length > 0 && (
            <img
              src={(item.productimages || item.images)[0]}
              alt={item.productname || item.title}
              className="w-32 h-32 object-contain mb-4"
            />
          )}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="font-medium">Brand:</div>
          <div>{item.productbrand || item.brand || "N/A"}</div>

          <div className="font-medium">Category:</div>
          <div>{item.productcategory || item.category || "N/A"}</div>

          <div className="font-medium">UPC:</div>
          <div>{item.productupc || item.upc}</div>

          <div className="font-medium">Description:</div>
          <div className="col-span-2">
            {item.productdescription ||
              item.description ||
              "No description available"}
          </div>

          {(item.productlowestprice || item.lowest_price) && (
            <>
              <div className="font-medium">Price Range:</div>
              <div>
                {item.productcurrency || item.currency || "$"}
                {item.productlowestprice || item.lowest_price}
                {(item.producthighestprice || item.highest_price) &&
                  ` - ${item.producthighestprice || item.highest_price}`}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">UPC Product Lookup</h1>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={upc}
            onChange={(e) => setUpc(e.target.value)}
            placeholder="Enter UPC code (e.g., 4002293401102)"
            className="flex-1 p-2 border rounded"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
          >
            {loading ? "Looking up..." : "Lookup"}
          </button>
        </div>
      </form>

      {renderError()}
      {renderSearchInfo()}

      {result && result.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">
            Found {result.length} item(s):
          </h2>
          {result.map(renderProductInfo)}
        </div>
      )}
    </div>
  );
};

export default ExamplePage;
