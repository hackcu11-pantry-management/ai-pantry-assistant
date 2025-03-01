import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import ExamplePage from "./pages/ExamplePage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/ex" element={<ExamplePage />} />
      </Routes>
    </Router>
  );
}

export default App;
