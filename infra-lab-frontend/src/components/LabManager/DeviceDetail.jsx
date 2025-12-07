import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./DeviceDetail.css";

export default function DeviceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [device, setDevice] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);

  // ------------------- GET DATA FROM BACKEND -------------------
  useEffect(() => {
    if (!id) return;

    fetch(`http://localhost:5000/api/device-detail/${id}`) 
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setDevice(json.data.device);
          setInventory(json.data.inventory);
        }
      })
      .catch((err) => console.error("Fetch error:", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="loading">Đang tải dữ liệu...</p>;
  if (!device) return <p className="error">Không tìm thấy thiết bị.</p>;

  const borrowed =
    inventory.total - inventory.available - (inventory.broken || 0);

  const getStatusColor = (type) => {
    const colors = {
      available: "#10b981",
      broken: "#ef4444",
      borrowed: "#f59e0b",
      total: "#6366f1",
    };
    return colors[type] || "#6b7280";
  };

  return (
    <div className="device-detail-container">
      
      {/* HEADER */}
      <div className="detail-header">
        <h1 className="detail-title">Chi tiết thiết bị</h1>
        <button className="close-btn" onClick={() => navigate(-1)}>
          ×
        </button>
      </div>

      <div className="detail-content">
        
        {/* LEFT */}
        <div className="detail-left">
          <div className="image-container">
            <img
              src={device.image || "/placeholder.svg"}
              alt={device.name}
              className="device-image"
            />
          </div>

          <div className="device-info">
            <h2 className="device-name">{device.name}</h2>
            <p className="device-category">{device.category_id?.name}</p>
            <p className="device-location">📍 Phòng Lab – Kho A</p>

            <p className="device-description">
              {device.description || "Không có mô tả."}
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="detail-right">

          {/* INVENTORY */}
          <div className="inventory-section">
            <h3 className="section-title">Thống kê kho</h3>

            <div className="inventory-grid">
              <div className="inventory-card">
                <div className="inventory-icon" style={{ background: getStatusColor("total") }}>📦</div>
                <div className="inventory-info">
                  <span className="inventory-label">Tổng</span>
                  <span className="inventory-value">{inventory.total}</span>
                </div>
              </div>

              <div className="inventory-card">
                <div className="inventory-icon" style={{ background: getStatusColor("available") }}>✓</div>
                <div className="inventory-info">
                  <span className="inventory-label">Có sẵn</span>
                  <span className="inventory-value">{inventory.available}</span>
                </div>
              </div>

              <div className="inventory-card">
                <div className="inventory-icon" style={{ background: getStatusColor("borrowed") }}>👤</div>
                <div className="inventory-info">
                  <span className="inventory-label">Đang mượn</span>
                  <span className="inventory-value">{borrowed}</span>
                </div>
              </div>

              <div className="inventory-card">
                <div className="inventory-icon" style={{ background: getStatusColor("broken") }}>⚠️</div>
                <div className="inventory-info">
                  <span className="inventory-label">Hỏng</span>
                  <span className="inventory-value">{inventory.broken}</span>
                </div>
              </div>
            </div>
          </div>

          {/* PROGRESS BARS */}
          <div className="progress-section">
            <h3 className="section-title">Tỷ lệ sử dụng</h3>

            <div className="progress-bars">
              
              <div className="progress-item">
                <div className="progress-label">
                  <span>Có sẵn</span>
                  <span className="progress-percent">
                    {Math.round((inventory.available / inventory.total) * 100)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill available" style={{ width: `${(inventory.available / inventory.total) * 100}%` }}></div>
                </div>
              </div>

              <div className="progress-item">
                <div className="progress-label">
                  <span>Đang mượn</span>
                  <span className="progress-percent">
                    {Math.round((borrowed / inventory.total) * 100)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill borrowed" style={{ width: `${(borrowed / inventory.total) * 100}%` }}></div>
                </div>
              </div>

              <div className="progress-item">
                <div className="progress-label">
                  <span>Hỏng</span>
                  <span className="progress-percent">
                    {Math.round((inventory.broken / inventory.total) * 100)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill broken" style={{ width: `${(inventory.broken / inventory.total) * 100}%` }}></div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* FOOTER */}
      <div className="detail-actions">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          Quay lại
        </button>
        <button className="btn btn-primary">Sửa thông tin</button>
      </div>
    </div>
  );
}
