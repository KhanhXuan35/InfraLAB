import React from 'react';
import './dashboard.css';

const REQUESTS = [
  {
    id: 'REQ-245',
    teacher: 'Thầy Minh',
    device: 'Máy quang phổ UV-Vis',
    department: 'Hóa phân tích',
    dueDate: 'Trước 10/12',
    status: 'Chờ duyệt',
    badge: 'status-pending',
  },
  {
    id: 'REQ-231',
    teacher: 'Cô Lan',
    device: 'Bộ cảm biến sinh học',
    department: 'Công nghệ sinh học',
    dueDate: 'Trước 08/12',
    status: 'Ưu tiên cao',
    badge: 'status-urgent',
  },
  {
    id: 'REQ-227',
    teacher: 'Thầy Huy',
    device: 'Kính hiển vi điện tử',
    department: 'Vật liệu',
    dueDate: 'Trước 15/12',
    status: 'Sẵn sàng xuất',
    badge: 'status-ready',
  },
  {
    id: 'REQ-225',
    teacher: 'Cô Trâm',
    device: 'Máy PCR Real-Time',
    department: 'Sinh học phân tử',
    dueDate: 'Trước 12/12',
    status: 'Chờ duyệt',
    badge: 'status-pending',
  },
];

const SHIPMENTS = [
  {
    title: 'Đơn SG-104',
    info: 'Đến ĐH KHTN · 04 thiết bị',
    time: 'Đang vận chuyển',
    status: 'Đang giao',
  },
  {
    title: 'Đơn HN-221',
    info: 'Đến ĐH Bách Khoa · 06 thiết bị',
    time: 'Đã rời kho 03/12',
    status: 'Đã bàn giao 70%',
  },
  {
    title: 'Đơn DN-087',
    info: 'Đến ĐH Sư phạm · 03 thiết bị',
    time: 'Chuẩn bị đóng gói',
    status: 'Đóng gói',
  },
];

const HIGHLIGHTS = [
  {
    label: 'Yêu cầu chờ duyệt',
    value: '08',
    trend: '+2 yêu cầu mới hôm nay',
    color: '#fbbf24',
  },
  {
    label: 'Thiết bị sẵn sàng xuất',
    value: '320',
    trend: 'Tăng 12 thiết bị',
    color: '#34d399',
  },
  {
    label: 'Đơn đang giao',
    value: '05',
    trend: '3 đơn dự kiến giao hôm nay',
    color: '#60a5fa',
  },
];

function SchoolDashboard() {
  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand">
            InFra<span>Lab</span>
          </div>

          <div>
            <div className="sidebar-menu-title">School</div>
            <div className="menu-list">
              <div className="menu-item">
                <span className="icon">🏠</span>
                <span>Tổng quan</span>
              </div>
              <div className="menu-item">
                <span className="icon">📦</span>
                <span>Kho thiết bị</span>
              </div>
              <div className="menu-item active">
                <span className="icon">📨</span>
                <span>Yêu cầu từ giáo viên</span>
              </div>
              <div className="menu-item">
                <span className="icon">🚚</span>
                <span>Đơn xuất kho</span>
              </div>
              <div className="menu-item">
                <span className="icon">🛠</span>
                <span>Lịch bảo trì</span>
              </div>
              <div className="menu-item">
                <span className="icon">📑</span>
                <span>Hợp đồng</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sidebar-footer">Đăng xuất</div>
      </aside>

      {/* Main */}
      <main className="main">
        <header className="main-header">
          <div className="main-title">Trung tâm cung ứng thiết bị InFraLab</div>
          <div className="main-user">
            <span>Xin chào, School Admin!</span>
            <div className="user-avatar" />
          </div>
        </header>

        <section className="supplier-highlight">
          {HIGHLIGHTS.map((item) => (
            <div className="highlight-card" key={item.label}>
              <div className="highlight-label">
                <span>{item.label}</span>
                <span role="img" aria-label="icon">
                  ●
                </span>
              </div>
              <div className="highlight-value" style={{ color: item.color }}>
                {item.value}
              </div>
              <div className="highlight-trend">{item.trend}</div>
            </div>
          ))}
        </section>

        <section className="supplier-panels">
          <div className="panel-card">
            <div className="panel-title">Yêu cầu mới từ giáo viên</div>
            <div className="panel-subtitle">Ưu tiên xử lý trong vòng 24 giờ</div>

            <div className="panel-list">
              {REQUESTS.map((req) => (
                <div className="request-item" key={req.id}>
                  <div className="request-details">
                    <div className="request-name">
                      {req.id} · {req.teacher}
                    </div>
                    <div className="request-meta">
                      {req.device} · {req.department}
                    </div>
                    <div className="request-date">{req.dueDate}</div>
                  </div>
                  <div className={`status-pill ${req.badge}`}>{req.status}</div>
                </div>
              ))}
            </div>

            <div className="supplier-actions">
              <button className="button-primary green">Duyệt nhanh</button>
              <button className="button-secondary">Xem tất cả</button>
            </div>
          </div>

          <div className="panel-card">
            <div className="panel-title">Trạng thái giao hàng</div>
            <div className="panel-subtitle">Theo dõi tiến độ xuất kho</div>

            <div className="timeline">
              {SHIPMENTS.map((step) => (
                <div className="timeline-row" key={step.title}>
                  <div className="timeline-step">
                    <div className="timeline-title">{step.title}</div>
                    <div className="timeline-meta">{step.info}</div>
                    <div className="request-date">{step.time}</div>
                  </div>
                  <div className="timeline-status">{step.status}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="supplier-bottom">
          <div className="info-block">
            <div className="panel-title">Tổng quan kho</div>
            <div className="inventory-grid">
              <div>
                <div className="info-label">Sẵn sàng xuất</div>
                <div className="info-value">320 thiết bị</div>
              </div>
              <div>
                <div className="info-label">Đang sửa chữa</div>
                <div className="info-value">24 thiết bị</div>
              </div>
              <div>
                <div className="info-label">Dự kiến nhập kho</div>
                <div className="info-value">58 thiết bị</div>
              </div>
              <div>
                <div className="info-label">Tỷ lệ sử dụng</div>
                <div className="info-value">82%</div>
              </div>
            </div>
          </div>

          <div className="info-block">
            <div className="panel-title">Lịch bảo trì tuần này</div>
            <div className="maintenance-list">
              <div className="maintenance-item">
                <span>Máy sắc ký lỏng</span>
                <span className="maintenance-date">05/12</span>
              </div>
              <div className="maintenance-item">
                <span>Buồng nuôi cấy tế bào</span>
                <span className="maintenance-date">06/12</span>
              </div>
              <div className="maintenance-item">
                <span>Máy quang phổ FTIR</span>
                <span className="maintenance-date">08/12</span>
              </div>
              <div className="maintenance-item">
                <span>Tủ lạnh âm sâu</span>
                <span className="maintenance-date">09/12</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default SchoolDashboard;

