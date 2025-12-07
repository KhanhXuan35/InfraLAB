import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function DashboardOverview() {
  const [highlights, setHighlights] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch stats và requests song song
        const [statsRes, requestsRes] = await Promise.all([
          fetch(`${API_BASE}/school-dashboard/stats`),
          fetch(`${API_BASE}/school-dashboard/requests?limit=4&status=pending`),
        ]);

        const statsData = await statsRes.json();
        const requestsData = await requestsRes.json();

        if (statsData.success) {
          // Format highlights data
          const highlightsData = [
            {
              label: 'Yêu cầu chờ duyệt',
              value: String(statsData.data.pendingRequests || 0).padStart(2, '0'),
              trend: `+${statsData.data.newRequestsToday || 0} yêu cầu mới hôm nay`,
              color: '#fbbf24',
            },
            {
              label: 'Thiết bị sẵn sàng xuất',
              value: String(statsData.data.readyToShip || 0),
              trend: `Tăng ${statsData.data.increaseDevices || 0} thiết bị`,
              color: '#34d399',
            },
            {
              label: 'Lô hàng đang giao',
              value: String(statsData.data.shipmentsInTransit || 0).padStart(2, '0'),
              trend: 'Cập nhật vừa xong',
              color: '#38bdf8',
            },
          ];
          setHighlights(highlightsData);
        }

        if (requestsData.success) {
          setRequests(requestsData.data || []);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#000000' }}>
        Đang tải dữ liệu...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#b91c1c' }}>
        {error}
      </div>
    );
  }

  return (
    <>
      <section className="supplier-highlight">
        {highlights.map((item) => (
          <div className="highlight-card" key={item.label}>
            <div className="highlight-label">
              <span>{item.label}</span>
              <span role="img" aria-label="icon">
                *
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
          <div className="panel-subtitle">Ưu tiên xử lý trong 24 giờ</div>

          <div className="panel-list">
            {requests.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#000000' }}>
                Chưa có yêu cầu nào
              </div>
            ) : (
              requests.map((req) => (
                <div className="request-item" key={req.id || req._id}>
                  <div className="request-details">
                    <div className="request-name">
                      {req.id} - {req.teacher}
                    </div>
                    <div className="request-meta">
                      {req.device} - {req.department || 'N/A'}
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
    </>
  );
}

export default DashboardOverview;
