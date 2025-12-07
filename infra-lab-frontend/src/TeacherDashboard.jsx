// src/TeacherDashboard.jsx
import React, { useState, useEffect } from "react";
import "./dashboard.css";
import { useNavigate, useLocation } from "react-router-dom";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State cho dữ liệu
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    repair: 0,
    broken: 0,
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Nếu không phải trang chủ, chỉ render sidebar (để App.jsx xử lý Outlet)
  const isHomePage = location.pathname === "/" || location.pathname === "";

  // Fetch dữ liệu từ API
  useEffect(() => {
    if (!isHomePage) return; // Chỉ fetch khi ở trang chủ

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch stats và activities song song
        const [statsRes, activitiesRes] = await Promise.all([
          fetch("http://localhost:5000/api/dashboard/stats"),
          fetch("http://localhost:5000/api/dashboard/activities"),
        ]);

        const statsData = await statsRes.json();
        const activitiesData = await activitiesRes.json();

        if (statsData.success) {
          setStats(statsData.data);
        }

        if (activitiesData.success) {
          setActivities(activitiesData.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isHomePage]);

  // Nếu không phải trang chủ, chỉ render sidebar
  if (!isHomePage) {
    return (
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            InFra<span>Lab</span>
          </div>

          <div>
            <div className="sidebar-menu-title">Lab Manager</div>
            <div className="menu-list">
            <div 
                className={`menu-item ${isHomePage ? "active" : ""}`} 
                onClick={() => navigate("/")}
              >
                <span className="icon">📊</span>
                <span>Thống kê</span>
              </div>
              <div 
                className={`menu-item ${location.pathname === "/devices" || location.pathname.startsWith("/device/") ? "active" : ""}`} 
                onClick={() => navigate("/devices")}
              >
                <span className="icon">🧪</span>
                <span>Quản lý thiết bị</span>
              </div>

              <div className="menu-item">
                <span className="icon">↔️</span>
                <span>Mượn/Trả</span>
              </div>
              <div className="menu-item">
                <span className="icon">📑</span>
                <span>Báo cáo</span>
              </div>

              <div className="menu-item">
                <span className="icon">🔔</span>
                <span>Notification</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sidebar-footer">Đăng xuất</div>
      </aside>
    );
  }

  // Trang chủ: render cả app-shell với sidebar và main content
  return (
    <div className="app-shell">
      {/* 侧边栏 */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            InFra<span>Lab</span>
          </div>

          <div>
            <div className="sidebar-menu-title">Lab Manager</div>
            <div className="menu-list">
              {/* 🔥 Bấm vào đây sẽ chuyển sang /devices */}
              <div 
                className={`menu-item ${isHomePage ? "active" : ""}`} 
                onClick={() => navigate("/")}
              >
                <span className="icon">📊</span>
                <span>Thống kê</span>
              </div>
              <div 
                className={`menu-item ${location.pathname === "/devices" || location.pathname.startsWith("/device/") ? "active" : ""}`} 
                onClick={() => navigate("/devices")}
              >
                <span className="icon">🧪</span>
                <span>Quản lý thiết bị</span>
              </div>

              <div className="menu-item">
                <span className="icon">↔️</span>
                <span>Mượn/Trả</span>
              </div>
              <div className="menu-item">
                <span className="icon">📑</span>
                <span>Báo cáo</span>
              </div>

              <div className="menu-item">
                <span className="icon">🔔</span>
                <span>Notification</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sidebar-footer">Đăng xuất</div>
      </aside>

      {/* 主区域 */}
      <main className="main">
        <header className="main-header">
          <div className="main-title">InFraLab</div>
          <div className="main-user">
            <span>Xin chào, Teacher!</span>
            <div className="user-avatar" />
          </div>
        </header>

        {/* 顶部统计卡片 */}
        <section className="stats-row">
          <div className="stat-card sc-total">
            <div className="stat-title">
              <div className="stat-icon" style={{ backgroundColor: '#1d4ed8', color: '#fff' }}>
                👥
              </div>
              <span>Tổng tài sản</span>
            </div>
            <div className="stat-value">{loading ? "..." : stats.total}</div>
          </div>

          <div className="stat-card sc-active">
            <div className="stat-title">
              <div className="stat-icon" style={{ backgroundColor: '#16a34a', color: '#fff' }}>
                ✔
              </div>
              <span>Đang hoạt động</span>
            </div>
            <div className="stat-value">{loading ? "..." : stats.available}</div>
          </div>

          <div className="stat-card sc-repair">
            <div className="stat-title">
              <div className="stat-icon" style={{ backgroundColor: '#f97316', color: '#fff' }}>
                🔧
              </div>
              <span>Đang sửa chữa</span>
            </div>
            <div className="stat-value">{loading ? "..." : stats.repair}</div>
          </div>

          <div className="stat-card sc-broken">
            <div className="stat-title">
              <div className="stat-icon" style={{ backgroundColor: '#b91c1c', color: '#fff' }}>
                ✖
              </div>
              <span>Hỏng/Thay thế</span>
            </div>
            <div className="stat-value">{loading ? "..." : stats.broken}</div>
          </div>
        </section>

        {/* 最近活动 + 快捷操作 */}
        <section className="two-cols">
          <div>
            <div className="section-title">Hoạt động gần đây</div>
            <div className="activity-list">
              {loading ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
                  Đang tải...
                </div>
              ) : activities.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
                  Chưa có hoạt động nào
                </div>
              ) : (
                activities.map((activity) => {
                  let icon = "→";
                  let className = "info";
                  
                  if (activity.type === "ok") {
                    icon = activity.message.includes("Thêm mới") ? "+" : "✓";
                    className = "ok";
                  } else if (activity.type === "error") {
                    icon = "⚠";
                    className = "error";
                  }

                  return (
                    <div key={activity.id} className="activity-item">
                      <span className={`activity-dot ${className}`}>{icon}</span>
                      <span>{activity.message}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <div className="section-title">Hành động nhanh</div>
            <div className="quick-actions">
              <div className="quick-actions-row">
                <button className="qa-btn qa-blue">+ Yêu cầu thêm thiết bị</button>
                <button className="qa-btn qa-purple">↔ Ghi nhận mượn/trả</button>
              </div>
              <div className="quick-actions-row">
                <button className="qa-btn qa-yellow">🔍 Tìm kiếm thiết bị</button>
                <button className="qa-btn qa-green">📑 Xuất báo cáo</button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
