// src/UserDashboard.jsx
import React from 'react';
import './dashboard.css';

function UserDashboard() {
  return (
    <div className="app-shell">
      {/* 侧边栏 */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand">
            InFra<span>Lab</span>
          </div>

          <div>
            <div className="sidebar-menu-title">Menu</div>
            <div className="menu-list">
              <div className="menu-item">
                <span className="icon">💬</span>
                <span>Chat</span>
              </div>
              <div className="menu-item">
                <span className="icon">📋</span>
                <span>Danh sách thiết bị</span>
              </div>
              <div className="menu-item active">
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
            <span>Xin chào, User!</span>
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
              <button className="button-primary">Xem chi tiết</button>
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