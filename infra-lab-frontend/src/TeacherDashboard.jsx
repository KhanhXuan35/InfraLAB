// src/TeacherDashboard.jsx
import React, { useState } from "react";
import "./dashboard.css";
import { useNavigate } from "react-router-dom";

export default function TeacherDashboard() {
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="brand">
          InFra<span>Lab</span>
        </div>

        <div>
          <div className="sidebar-menu-title">Lab Manager</div>
          <div className="menu-list">

            {/* 🔥 Bấm vào đây sẽ chuyển sang /devices */}
            <div className="menu-item" onClick={() => navigate("/devices")}>
              <span className="icon">🧪</span>
              <span>Quản lý thiết bị</span>
            </div>

            <div className="menu-item">
              <span className="icon">↔️</span>
              <span>Mượn/Trả</span>
            </div>

            <div className="menu-item" onClick={() => navigate("/")}>
              <span className="icon">📊</span>
              <span>Thống kê</span>
            </div>

            <div className="menu-item">
              <span className="icon">📑</span>
              <span>Báo cáo</span>
            </div>

            <div className="menu-item">
              <span className="icon">🔔</span>
              <span>Thông báo</span>
            </div>

          </div>
        </div>
      </div>

      <div className="sidebar-footer">Đăng xuất</div>
    </aside>
  );
}
