import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./DeviceDetail.css";
import api from "../../services/api";

export default function DeviceDetail() {
    const { id } = useParams(); // inventoryId
    const navigate = useNavigate();

    const [device, setDevice] = useState(null);
    const [inventory, setInventory] = useState(null);
    const [loading, setLoading] = useState(true);

    // repair states
    const [showRepairModal, setShowRepairModal] = useState(false);
    const [repairReason, setRepairReason] = useState("");
    const [repairLoading, setRepairLoading] = useState(false);
    const [repairMessage, setRepairMessage] = useState("");
    const [existingRepair, setExistingRepair] = useState(null);

    // =================== LOAD DEVICE DETAIL ===================
    useEffect(() => {
        if (!id) return;

        const fetchDeviceDetail = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/device-detail/${id}`);
                if (response.success) {
                    setDevice(response.data.device);
                    setInventory(response.data.inventory);
                }
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDeviceDetail();
    }, [id]);

    // =================== LOAD REPAIR STATUS ===================
    useEffect(() => {
        if (!device?._id) return;

        const fetchRepairStatus = async () => {
            try {
                const response = await api.get(`/repairs/device/${device._id}`);
                if (response.success && response.data) {
                    setExistingRepair(response.data);
                }
            } catch (err) {
                console.error("Repair status error:", err);
            }
        };

        fetchRepairStatus();
    }, [device]);

    if (loading) return <p className="loading">Đang tải dữ liệu...</p>;
    if (!device || !inventory)
        return <p className="error">Không tìm thấy thiết bị.</p>;

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

    // =================== CREATE REPAIR REQUEST ===================
    const handleCreateRepair = async () => {
        if (existingRepair && existingRepair.status === "pending") {
            setRepairMessage("⚠️ Thiết bị này đã có yêu cầu sửa chữa đang chờ duyệt.");
            return;
        }

        if (!repairReason.trim()) {
            setRepairMessage("⚠️ Vui lòng nhập lý do hỏng.");
            return;
        }

        setRepairLoading(true);
        setRepairMessage("");

        try {
            const response = await api.post("/repairs", {
                device_id: device._id,
                quantity: inventory.broken,  // auto số lượng hỏng
                reason: repairReason,
            });

            if (!response.success) {
                setRepairMessage(response.message || "❌ Không thể tạo yêu cầu.");
                return;
            }

            setRepairMessage("✅ Đã gửi yêu cầu sửa chữa. Đang chờ duyệt.");
            setExistingRepair(response.data);
            setRepairReason("");

        } catch (err) {
            console.error("create repair error:", err);
            setRepairMessage(err.message || "❌ Lỗi hệ thống, vui lòng thử lại sau.");
        } finally {
            setRepairLoading(false);
        }
    };

    return (
        <div className="device-detail-container">

            {/* HEADER */}
            <div className="detail-header">
                <h1 className="detail-title">Chi tiết thiết bị</h1>
                <button className="close-btn" onClick={() => navigate(-1)}>×</button>
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
                        <h3 className="section-title">THỐNG KÊ KHO</h3>

                        <div className="inventory-grid">

                            <div className="inventory-card">
                                <div className="inventory-icon total-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                                        <path d="M2 17L12 22L22 17" />
                                        <path d="M2 12L12 17L22 12" />
                                    </svg>
                                </div>
                                <div className="inventory-info">
                                    <span className="inventory-label">TỔNG</span>
                                    <span className="inventory-value">{inventory.total}</span>
                                </div>
                            </div>

                            <div className="inventory-card">
                                <div className="inventory-icon available-icon">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M16.667 5L7.5 14.167L3.333 10" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                                <div className="inventory-info">
                                    <span className="inventory-label">CÓ SẴN</span>
                                    <span className="inventory-value">{inventory.available}</span>
                                </div>
                            </div>

                            <div className="inventory-card">
                                <div className="inventory-icon borrowed-icon">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M10 10C11.3807 10 12.5 8.88071 12.5 7.5C12.5 6.11929 11.3807 5 10 5C8.61929 5 7.5 6.11929 7.5 7.5C7.5 8.88071 8.61929 10 10 10Z" />
                                        <path d="M5 17.5C5 14.4624 7.46243 12 10.5 12H9.5C12.5376 12 15 14.4624 15 17.5" strokeLinecap="round"/>
                                    </svg>
                                </div>
                                <div className="inventory-info">
                                    <span className="inventory-label">ĐANG MƯỢN</span>
                                    <span className="inventory-value">{borrowed}</span>
                                </div>
                            </div>

                            <div className="inventory-card">
                                <div className="inventory-icon broken-icon">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M10 6V10M10 14H10.01" strokeLinecap="round" strokeLinejoin="round"/>
                                        <circle cx="10" cy="10" r="8" />
                                    </svg>
                                </div>
                                <div className="inventory-info">
                                    <span className="inventory-label">HỎNG</span>
                                    <span className="inventory-value">{inventory.broken ?? 0}</span>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* PROGRESS BARS */}
                    <div className="progress-section">
                        <h3 className="section-title">TỶ LỆ SỬ DỤNG</h3>

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
                    QUAY LẠI
                </button>

                {inventory.broken > 0 && (
                    <button
                        className="btn btn-warning"
                        onClick={() => setShowRepairModal(true)}
                    >
                        TẠO YÊU CẦU SỬA CHỮA
                    </button>
                )}

                <button className="btn btn-primary">SỬA THÔNG TIN</button>
            </div>

            {/* MODAL */}
            {showRepairModal && (
                <div className="modal-overlay" onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        setShowRepairModal(false);
                        setRepairMessage("");
                    }
                }}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>

                        <h3>📌 Tạo yêu cầu sửa chữa</h3>
                        <p style={{ fontWeight: "bold", marginBottom: '16px' }}>{device.name}</p>

                        {existingRepair && (existingRepair.status === "pending" || existingRepair.status === "approved" || existingRepair.status === "in_progress") && (
                            <p className="modal-warning">
                                Thiết bị này đã có yêu cầu sửa chữa đang được xử lý, không thể tạo thêm!
                            </p>
                        )}

                        <div className="modal-field">
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Số lượng hỏng:</label>
                            <p className="broken-display" style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>{inventory.broken}</p>
                        </div>

                        <label className="modal-label" style={{ display: 'block', marginTop: '16px' }}>
                            <span style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Lý do hỏng</span>
                            <textarea
                                rows={3}
                                value={repairReason}
                                onChange={(e) => setRepairReason(e.target.value)}
                                placeholder="Mô tả tình trạng hỏng..."
                                style={{ width: '100%', padding: '10px', background: '#1f2937', border: '1px solid #374151', color: 'white', borderRadius: '6px', marginTop: '6px' }}
                            />
                        </label>

                        {repairMessage && (
                            <p className={`modal-message ${repairMessage.includes('✅') ? 'success' : (repairMessage.includes('❌') || repairMessage.includes('⚠️')) ? 'error' : ''}`}>
                                {repairMessage}
                            </p>
                        )}

                        <div className="modal-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    setShowRepairModal(false);
                                    setRepairMessage("");
                                }}
                            >
                                ĐÓNG
                            </button>

                            <button
                                className="btn btn-primary"
                                disabled={repairLoading || (existingRepair && (existingRepair.status === "pending" || existingRepair.status === "approved" || existingRepair.status === "in_progress"))}
                                onClick={handleCreateRepair}
                            >
                                {repairLoading ? "Đang gửi..." : "GỬI YÊU CẦU"}
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
