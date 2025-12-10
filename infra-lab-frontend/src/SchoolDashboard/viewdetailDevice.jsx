import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../dashboard.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const PLACEHOLDER_IMG =
  'https://via.placeholder.com/480x320/0f172a/94a3b8?text=No+image';

function ViewDetailDevice() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [device, setDevice] = useState(null);
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.body.classList.add('detail-dark-header');
    return () => document.body.classList.remove('detail-dark-header');
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [devRes, invRes] = await Promise.all([
          fetch(`${API_BASE}/devices/${id}`),
          fetch(`${API_BASE}/inventories`),
        ]);

        if (!devRes.ok) {
          throw new Error('Không lấy được thông tin thiết bị');
        }

        const devJson = await devRes.json();
        const invJson = invRes.ok ? await invRes.json() : [];

        // API có thể trả dạng { data: {...} } hoặc trực tiếp object
        const devData = devJson?.data || devJson;
        const invList = Array.isArray(invJson) ? invJson : invJson?.data || [];

        setDevice(devData);
        setInventories(invList);
      } catch (err) {
        setError(err.message || 'Đã xảy ra lỗi');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const inventoryInfo = useMemo(() => {
    if (!device || !inventories.length) {
      return { total: 0, available: 0, broken: 0, borrowing: 0 };
    }
    const devId = device._id || device.id || '';
    const inv = inventories.find((i) => {
      const iDev = i.device_id?._id || i.device_id || '';
      return String(iDev) === String(devId);
    });
    const total = inv?.total ?? 0;
    const available = inv?.available ?? 0;
    const broken = inv?.broken ?? 0;
    const borrowing = Math.max(total - available - broken, 0);
    return { total, available, broken, borrowing };
  }, [device, inventories]);

  if (loading) {
    return (
      <div className="device-detail-page">
        <div className="inventory-status">Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="device-detail-page">
        <div className="inventory-status error">{error || 'Không tìm thấy thiết bị'}</div>
        <button className="button-secondary" onClick={() => navigate(-1)}>
          Quay lại
        </button>
      </div>
    );
  }

  const categoryName =
    (device.category && device.category.name) ||
    (device.category_id && device.category_id.name) ||
    device.category?.name ||
    device.category_id?.name ||
    'N/A';

  return (
    <div className="device-detail-page">
      <div className="device-detail-header">
        <button className="button-secondary" onClick={() => navigate(-1)}>
          Quay lại
        </button>
        <div className="device-detail-title">Chi tiết linh kiện</div>
      </div>

      <div className="device-detail-card">
        <div className="device-detail-left">
          <div className="device-detail-image">
            <img src={device.image || PLACEHOLDER_IMG} alt={device.name || 'device'} />
          </div>
        </div>

        <div className="device-detail-right">
          <div className="detail-row">
            <div className="detail-label">Tên linh kiện</div>
            <div className="detail-value">{device.name || 'N/A'}</div>
          </div>

          <div className="detail-row">
            <div className="detail-label">Danh mục</div>
            <div className="detail-value">{categoryName}</div>
          </div>

          <div className="detail-grid">
            <div className="detail-box">
              <div className="detail-box-label">Tổng</div>
              <div className="detail-box-value">{inventoryInfo.total}</div>
            </div>
            <div className="detail-box">
              <div className="detail-box-label">Đang rảnh</div>
              <div className="detail-box-value text-success">{inventoryInfo.available}</div>
            </div>
            <div className="detail-box">
              <div className="detail-box-label">Đang mượn</div>
              <div className="detail-box-value text-warning">{inventoryInfo.borrowing}</div>
            </div>
            <div className="detail-box">
              <div className="detail-box-label">Hỏng</div>
              <div className="detail-box-value text-danger">{inventoryInfo.broken}</div>
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-label">Mô tả</div>
            <div className="detail-description">{device.description || 'Không có mô tả'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewDetailDevice;
