import React from "react";
import { Outlet } from "react-router-dom";

// Dashboard pages
import UserDashboard from "./UserDashboard";
import TeacherDashboard from "./TeacherDashboard";
import SchoolDashboard from "./assets/SchoolDashboard/SchoolDashboard.jsx";

export default function App() {
  const currentView = "user"; // Tạm set cứng để test UI

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", margin: 0, padding: 0, overflow: "hidden" }}>

      {/* Dashboard cố định bên trái */}
      {currentView === "teacher" && <TeacherDashboard />}
      {currentView === "school" && <SchoolDashboard />}
      {currentView === "user" && <UserDashboard />}

      {/* Nơi load từng trang */}
      <div style={{ flex: 1, height: "100vh", overflow: "hidden" }}>
        <Outlet />
      </div>

    </div>
  );
}
