// src/TeacherDashboard.jsx
import React from 'react';
import './dashboard.css';

function TeacherDashboard() {
  return (
    <div className="app-shell">
      {/* 侧边栏 */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand">
            InFra<span>Lab</span>
          </div>

          <div>
            <div className="sidebar-menu-title">Lab Manager</div>
            <div className="menu-list">
              <div className="menu-item active">
                <span className="icon">🧪</span>
                <span>Quản lý thiết bị</span>
              </div>
              <div className="menu-item">
                <span className="icon">↔️</span>
                <span>Mượn/Trả</span>
              </div>
              <div className="menu-item">
                <span className="icon">📊</span>
                <span>Thống kê</span>
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
            <div className="stat-value">120</div>
          </div>

          <div className="stat-card sc-active">
            <div className="stat-title">
              <div className="stat-icon" style={{ backgroundColor: '#16a34a', color: '#fff' }}>
                ✔
              </div>
              <span>Đang hoạt động</span>
            </div>
            <div className="stat-value">95</div>
          </div>

          <div className="stat-card sc-repair">
            <div className="stat-title">
              <div className="stat-icon" style={{ backgroundColor: '#f97316', color: '#fff' }}>
                🔧
              </div>
              <span>Đang sửa chữa</span>
            </div>
            <div className="stat-value">15</div>
          </div>

          <div className="stat-card sc-broken">
            <div className="stat-title">
              <div className="stat-icon" style={{ backgroundColor: '#b91c1c', color: '#fff' }}>
                ✖
              </div>
              <span>Hỏng/Thay thế</span>
            </div>
            <div className="stat-value">10</div>
          </div>
        </section>

        {/* 最近活动 + 快捷操作 */}
        <section className="two-cols">
          <div>
            <div className="section-title">Hoạt động gần đây</div>
            <div className="activity-list">
              <div className="activity-item">
                <span className="activity-dot info">→</span>
                <span>Thiết bị "Máy đo quang phổ" được mượn bởi Nguyễn Văn A.</span>
              </div>
              <div className="activity-item">
                <span className="activity-dot ok">✓</span>
                <span>Thiết bị "Kính hiển vi điện tử" được trả lại.</span>
              </div>
              <div className="activity-item">
                <span className="activity-dot error">⚠</span>
                <span>Thiết bị "Máy ly tâm" báo hỏng.</span>
              </div>
              <div className="activity-item">
                <span className="activity-dot ok">+</span>
                <span>Thêm mới thiết bị "Máy phân tích phổ".</span>
              </div>
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

export default TeacherDashboard;