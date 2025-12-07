// src/UserDashboard.jsx
import React, { useState, useEffect } from 'react';
import './dashboard.css';
import { useNavigate, useLocation } from 'react-router-dom';

function UserDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [stats, setStats] = useState({
    totalBorrowed: 0,
    pendingRequests: 0,
    unreadNotifications: 0,
  });
  const [loading, setLoading] = useState(true);

  // Nếu không phải trang chủ, chỉ render sidebar (để App.jsx xử lý Outlet)
  const isHomePage = location.pathname === "/" || location.pathname === "";

  // Fetch dữ liệu từ API
  useEffect(() => {
    if (!isHomePage) return; // Chỉ fetch khi ở trang chủ

    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Tạm thời dùng userId = null hoặc có thể lấy từ auth context
        // Trong thực tế, userId sẽ lấy từ authentication token
        const userId = null; // TODO: Lấy từ auth context

        if (!userId) {
          // Nếu chưa có userId, set loading = false và return
          setLoading(false);
          return;
        }

        const statsRes = await fetch(
          `http://localhost:5000/api/user-dashboard/stats?userId=${userId}`
        );

        const statsData = await statsRes.json();

        if (statsData.success) {
          setStats(statsData.data);
        }
      } catch (error) {
        console.error("Error fetching user dashboard data:", error);
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
            <div className="sidebar-menu-title">Danh mục</div>
            <div className="menu-list">
              <div 
                className={`menu-item ${isHomePage ? "active" : ""}`} 
                onClick={() => navigate("/")}
              >
                <span className="icon">🏠</span>
                <span>Trang chủ</span>
              </div>
              <div 
                className={`menu-item ${location.pathname === "/devices" || location.pathname.startsWith("/device/") ? "active" : ""}`} 
                onClick={() => navigate("/devices")}
              >
                <span className="icon">📋</span>
                <span>Danh sách thiết bị</span>
              </div>
              <div className="menu-item">
                <span className="icon">📦</span>
                <span>Thiết bị đang mượn</span>
              </div>
              <div className="menu-item">
                <span className="icon">📨</span>
                <span>Gửi yêu cầu mượn</span>
              </div>
              <div className="menu-item">
                <span className="icon">📝</span>
                <span>Yêu cầu trả thiết bị</span>
              </div>
              <div className="menu-item">
                <span className="icon">📅</span>
                <span>Lịch sử mượn - trả</span>
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
            <div className="sidebar-menu-title">Danh mục</div>
            <div className="menu-list">
              <div 
                className={`menu-item ${isHomePage ? "active" : ""}`} 
                onClick={() => navigate("/")}
              >
                <span className="icon">🏠</span>
                <span>Trang chủ</span>
              </div>
              <div 
                className={`menu-item ${location.pathname === "/devices" || location.pathname.startsWith("/device/") ? "active" : ""}`} 
                onClick={() => navigate("/devices")}
              >
                <span className="icon">📋</span>
                <span>Danh sách thiết bị</span>
              </div>
              <div className="menu-item">
                <span className="icon">📦</span>
                <span>Thiết bị đang mượn</span>
              </div>
              <div className="menu-item">
                <span className="icon">📨</span>
                <span>Gửi yêu cầu mượn</span>
              </div>
              <div className="menu-item">
                <span className="icon">📝</span>
                <span>Yêu cầu trả thiết bị</span>
              </div>
              <div className="menu-item">
                <span className="icon">📅</span>
                <span>Lịch sử mượn - trả</span>
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

      {/* 主区域 */}
      <main className="main">
        <header className="main-header">
          <div className="main-title">Chào mừng đến với hệ thống quản lý thiết bị phòng Lab!</div>
          <div className="main-user">
            <span>Xin chào, Người dùng!</span>
            <div className="user-avatar" />
          </div>
        </header>

        <section className="welcome-card">
          
          <div className="welcome-sub">
            Sử dụng menu bên trái để điều hướng và quản lý các thiết bị của bạn.
          </div>

          <div className="grid-2">
            {/* 卡片 1：Danh sách thiết bị */}
            <div className="feature-card fc-blue">
              <div className="feature-header">
                <div className="feature-dot feature-dot-blue" />
                <span>Danh sách thiết bị</span>
              </div>
              <div className="feature-desc">
                Xem và tìm kiếm các thiết bị hiện có trong phòng lab. Hỗ trợ tìm kiếm nâng cao theo loại, phòng và trạng thái.
              </div>
              <button className="button-primary" onClick={() => navigate("/devices")}>
                Xem danh sách
              </button>
            </div>

            {/* 卡片 2：Gửi yêu cầu mượn */}
            <div className="feature-card fc-green">
              <div className="feature-header">
                <span className="icon">✈️</span>
                <span>Gửi yêu cầu mượn</span>
              </div>
              <div className="feature-desc">
                Gửi yêu cầu mượn thiết bị một cách dễ dàng và nhanh chóng.
              </div>
              <button className="button-primary green">Tạo yêu cầu</button>
            </div>

            {/* 卡片 3：Thiết bị đang mượn */}
            <div className="feature-card fc-yellow">
              <div className="feature-header">
                <div className="feature-dot feature-dot-yellow" />
                <span>Thiết bị đang mượn</span>
              </div>
              <div className="feature-desc">
                Theo dõi các thiết bị bạn đang mượn và kiểm tra thời hạn trả.
              </div>
              <button className="button-primary yellow">Xem thiết bị</button>
            </div>

            {/* 卡片 4：Thông báo */}
            <div className="feature-card fc-purple">
              <div className="feature-header">
                <span className="icon">🔔</span>
                <span>Thông báo</span>
              </div>
              <div className="feature-desc">
                Nhận thông báo về việc duyệt mượn, trả thiết bị và các thiết bị quá hạn.
              </div>
              <button className="button-primary purple">Xem thông báo</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default UserDashboard;