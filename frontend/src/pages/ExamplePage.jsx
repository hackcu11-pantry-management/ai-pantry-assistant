import React, { useState } from "react";

const ExamplePage = () => {
  const [upc, setUpc] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`http://localhost:5001/api/lookup-upc?upc=${encodeURIComponent(upc)}`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Error fetching UPC data:', err);
      setError(err.message || 'Failed to lookup UPC');
    } finally {
      setLoading(false);
    }
  };

  const renderProductInfo = (item) => {
    return (
      <div key={item.upc} className="border rounded-lg p-4 mb-4 shadow-sm">
        <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
        {item.images && item.images.length > 0 && (
          <img 
            src={item.images[0]} 
            alt={item.title}
            className="w-32 h-32 object-contain mb-4"
          />
        )}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="font-medium">Brand:</div>
          <div>{item.brand || 'N/A'}</div>
          
          <div className="font-medium">Category:</div>
          <div>{item.category || 'N/A'}</div>
          
          <div className="font-medium">UPC:</div>
          <div>{item.upc}</div>
          
          <div className="font-medium">Description:</div>
          <div className="col-span-2">{item.description || 'No description available'}</div>
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
            {loading ? 'Looking up...' : 'Lookup'}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {result && result.items && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Found {result.items.length} item(s):</h2>
          {result.items.map(renderProductInfo)}
        </div>
      )}
    </div>
  );
};

export default ExamplePage;
