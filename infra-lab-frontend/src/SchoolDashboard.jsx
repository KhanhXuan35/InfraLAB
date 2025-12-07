import React, { useState, useEffect } from 'react';
import './dashboard.css';

function SchoolDashboard() {
  const [highlights, setHighlights] = useState([
    {
      label: 'Yêu cầu chờ duyệt',
      value: '0',
      trend: '0 yêu cầu mới hôm nay',
      color: '#fbbf24',
    },
    {
      label: 'Thiết bị sẵn sàng xuất',
      value: '0',
      trend: 'Tăng 0 thiết bị',
      color: '#34d399',
    },
  ]);
  const [requests, setRequests] = useState([]);
  const [warehouseStats, setWarehouseStats] = useState({
    readyToShip: 0,
    underRepair: 0,
    expectedIncoming: 0,
    usageRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const handleLogout = () => {
  // Xóa sạch thông tin đăng nhập
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
  // Chuyển hướng về trang Login
  navigate("/login");
};
  // Fetch dữ liệu từ API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch stats, requests, và warehouse stats song song
        const [statsRes, requestsRes, warehouseRes] = await Promise.all([
          fetch("http://localhost:5000/api/school-dashboard/stats"),
          fetch("http://localhost:5000/api/school-dashboard/requests?status=pending&limit=4"),
          fetch("http://localhost:5000/api/school-dashboard/warehouse-stats"),
        ]);

        const statsData = await statsRes.json();
        const requestsData = await requestsRes.json();
        const warehouseData = await warehouseRes.json();

        if (statsData.success) {
          setHighlights([
            {
              label: 'Yêu cầu chờ duyệt',
              value: statsData.data.pendingRequests.toString(),
              trend: `+${statsData.data.newRequestsToday} yêu cầu mới hôm nay`,
              color: '#fbbf24',
            },
            {
              label: 'Thiết bị sẵn sàng xuất',
              value: statsData.data.readyToShip.toString(),
              trend: `Tăng ${statsData.data.increaseDevices} thiết bị`,
              color: '#34d399',
            },
          ]);
        }

        if (requestsData.success) {
          setRequests(requestsData.data);
        }

        if (warehouseData.success) {
          setWarehouseStats(warehouseData.data);
        }
      } catch (error) {
        console.error("Error fetching school dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);
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
              {/* <div className="menu-item active">
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
              </div> */}
            </div>
          </div>
        </div>

        <div className="sidebar-footer" onClick={handleLogout}>Đăng xuất</div>
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
          {highlights.map((item) => (
            <div className="highlight-card" key={item.label}>
              <div className="highlight-label">
                <span>{item.label}</span>
                <span role="img" aria-label="icon">
                  ●
                </span>
              </div>
              <div className="highlight-value" style={{ color: item.color }}>
                {loading ? "..." : item.value}
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
              {loading ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
                  Đang tải...
                </div>
              ) : requests.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
                  Chưa có yêu cầu nào
                </div>
              ) : (
                requests.map((req) => (
                  <div className="request-item" key={req.id || req._id}>
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
                ))
              )}
            </div>
            <div className="supplier-actions">
              <button className="button-primary green">Duyệt nhanh</button>
              <button className="button-secondary">Xem tất cả</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default SchoolDashboard;
