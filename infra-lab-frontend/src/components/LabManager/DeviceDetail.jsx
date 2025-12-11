import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./DeviceDetail.css";
import api from "../../services/api";
import {
    Button,
    Card,
    Tag,
    Space,
    Statistic,
    Modal,
    Form,
    Input,
    InputNumber,
    Upload,
    message
} from "antd";

import { UploadOutlined } from "@ant-design/icons";

export default function DeviceDetail() {
    const { id } = useParams(); // inventoryId
    const navigate = useNavigate();

    const [device, setDevice] = useState(null);
    const [inventory, setInventory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [openReport, setOpenReport] = useState(false);
    const [image, setImage] = useState(null);
    const [loadingSubmit, setLoadingSubmit] = useState(false);

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


    const handleReport = async (values) => {
        setLoadingSubmit(true);

        const formData = new FormData();
        formData.append("device_id", device._id);
        formData.append("inventory_id", inventory._id);
        formData.append("quantity", values.quantity);
        formData.append("reason", values.reason);

        if (image) {
            formData.append("image", image);
        }

        try {
            const response = await api.post(
                "/repairs",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data", // override header JSON
                    }
                }
            );

            if (response.success) {
                message.success("Đã tạo yêu cầu sửa chữa.");
                setOpenReport(false);
            } else {
                message.error(response.message);
            }

        } catch (err) {
            console.error("Report error:", err);
            message.error("Thiết bị này đã có yêu cầu sửa chữa");
        }

        setLoadingSubmit(false);
    };



    // =================== CREATE REPAIR REQUEST ===================

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
                                        <path d="M16.667 5L7.5 14.167L3.333 10" strokeLinecap="round" strokeLinejoin="round" />
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
                                        <path d="M5 17.5C5 14.4624 7.46243 12 10.5 12H9.5C12.5376 12 15 14.4624 15 17.5" strokeLinecap="round" />
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
                                        <path d="M10 6V10M10 14H10.01" strokeLinecap="round" strokeLinejoin="round" />
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

                <Button
                    type="primary"
                    style={{ width: "100%", marginTop: 16 }}
                    onClick={() => setOpenReport(true)}
                >
                    Tạo yêu cầu sửa chữa
                </Button>
                <button className="btn btn-secondary" onClick={() => navigate(-1)}>
                    QUAY LẠI
                </button>


            </div>
            <Modal
                title="Tạo yêu cầu sửa chữa"
                open={openReport}
                onCancel={() => setOpenReport(false)}
                footer={null}
            >
                <Form layout="vertical" onFinish={handleReport}>
                    <Form.Item
                        label="Số lượng hỏng"
                        name="quantity"
                        rules={[
                            { required: true, message: "Vui lòng nhập số lượng" },
                            {
                                validator(_, value) {
                                    if (!value) return Promise.resolve();
                                    if (value > inventory.available) {
                                        return Promise.reject(
                                            new Error(`Không được vượt quá ${inventory.available} thiết bị có sẵn`)
                                        );
                                    }
                                    return Promise.resolve();
                                }
                            }
                        ]}
                    >
                        <InputNumber min={1} max={inventory.available} style={{ width: "100%" }} />
                    </Form.Item>

                    <Form.Item
                        label="Lý do"
                        name="reason"
                        rules={[{ required: true, message: "Vui lòng nhập lý do" }]}
                    >
                        <Input.TextArea rows={3} placeholder="Mô tả lỗi..." />
                    </Form.Item>

                    <Form.Item label="Ảnh minh chứng">
                        <Upload
                            beforeUpload={(file) => {
                                console.log("FILE:", file);
                                setImage(file);
                                return false;
                            }}
                            listType="picture"
                        >
                            <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
                        </Upload>

                    </Form.Item>

                    <Button type="primary" htmlType="submit" block loading={loadingSubmit}>
                        Gửi yêu cầu
                    </Button>
                </Form>
            </Modal>


        </div>
    );
}
