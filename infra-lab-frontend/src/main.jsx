import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./index.css";
import App from "./App.jsx";

import DeviceList from "./components/LabManager/DeviceList.jsx";
import DeviceDetailPage from "./pages/LabManager/DeviceDetailPage.jsx";
import RepairRequestList from "./pages/School/RepairRequestList.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>

      {/* APP LAYOUT */}
      <Route path="/" element={<App />}>

        {/* Default route */}
        <Route index element={<DeviceList />} />

        {/* Device List */}
        <Route path="devices" element={<DeviceList />} />

        {/* Device Detail */}
        <Route path="device/:id" element={<DeviceDetailPage />} />

        {/* ✅ NEW: Repair Request List (School View) */}
        <Route path="repairs" element={<RepairRequestList />} />
      </Route>

    </Routes>
  </BrowserRouter>
);
