import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./DeviceDetail.css";

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

    // =================== LOAD REPAIR STATUS ===================
    useEffect(() => {
        if (!device?._id) return;

        fetch(`http://localhost:5000/api/repairs/device/${device._id}`)
            .then(res => res.json())
            .then(json => {
                if (json.success && json.data) {
                    setExistingRepair(json.data);
                }
            })
            .catch(err => console.error(err));
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
            const res = await fetch("http://localhost:5000/api/repairs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    device_id: device._id,
                    quantity: inventory.broken,  // auto số lượng hỏng
                    reason: repairReason,
                }),
            });

            const json = await res.json();

            if (!json.success) {
                setRepairMessage(json.message || "❌ Không thể tạo yêu cầu.");
                return;
            }

            setRepairMessage("✅ Đã gửi yêu cầu sửa chữa. Đang chờ duyệt.");
            setExistingRepair(json.data);
            setRepairReason("");

        } catch (err) {
            console.error("create repair error:", err);
            setRepairMessage("❌ Lỗi hệ thống, vui lòng thử lại sau.");
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
                                    <span className="inventory-value">{inventory.broken ?? 0}</span>
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

                {inventory.broken > 0 && (
                    <button
                        className="btn btn-warning"
                        onClick={() => setShowRepairModal(true)}
                    >
                        Tạo yêu cầu sửa chữa
                    </button>
                )}

                <button className="btn btn-primary">Sửa thông tin</button>
            </div>

            {/* MODAL */}
            {showRepairModal && (
                <div className="modal-overlay">
                    <div className="modal">

                        <h3>📌 Tạo yêu cầu sửa chữa</h3>
                        <p style={{ fontWeight: "bold" }}>{device.name}</p>

                        {existingRepair && existingRepair.status === "pending" && (
                            <p className="modal-warning">
                                ⚠️ Thiết bị này đã có yêu cầu sửa chữa đang chờ duyệt.
                            </p>
                        )}

                        <div className="modal-field">
                            <label>Số lượng hỏng:</label>
                            <p className="broken-display">{inventory.broken}</p>
                        </div>

                        <label className="modal-label">
                            Lý do hỏng
                            <textarea
                                rows={3}
                                value={repairReason}
                                onChange={(e) => setRepairReason(e.target.value)}
                                placeholder="Mô tả tình trạng hỏng..."
                            />
                        </label>

                        {repairMessage && (
                            <p className="modal-message">{repairMessage}</p>
                        )}

                        <div className="modal-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    setShowRepairModal(false);
                                    setRepairMessage("");
                                }}
                            >
                                Đóng
                            </button>

                            <button
                                className="btn btn-primary"
                                disabled={repairLoading || (existingRepair && existingRepair.status === "pending")}
                                onClick={handleCreateRepair}
                            >
                                {repairLoading ? "Đang gửi..." : "Gửi yêu cầu"}
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
