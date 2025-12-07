import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./index.css";
import App from "./App.jsx";

import DeviceList from "./components/LabManager/DeviceList.jsx";
import DeviceDetailPage from "./pages/LabManager/DeviceDetailPage.jsx";

// Empty component for home page (TeacherDashboard renders its own content)
function HomePage() {
  return null;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>

      {/* APP LAYOUT */}
      <Route path="/" element={<App />}>

        {/* Default route - TeacherDashboard tự render main content */}
        <Route index element={<HomePage />} />

        {/* Device List */}
        <Route path="devices" element={<DeviceList />} />

        {/* Device Detail */}
        <Route path="device/:id" element={<DeviceDetailPage />} />

      </Route>

    </Routes>
  </BrowserRouter>
);
