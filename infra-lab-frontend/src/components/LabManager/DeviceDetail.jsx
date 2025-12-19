import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./DeviceDetail.css";
import api from "../../services/api";
import {
    Button,
    Tag,
    Modal,
    Form,
    Input,
    Upload,
    message,
    Drawer,
    Table
} from "antd";

import { UploadOutlined } from "@ant-design/icons";

export default function DeviceDetail() {
    const { id } = useParams(); // inventoryId
    const navigate = useNavigate();

    const [device, setDevice] = useState(null);
    const [inventory, setInventory] = useState(null);
    const [loading, setLoading] = useState(true);
    // Ảnh minh chứng cho yêu cầu sửa chữa
    const [image, setImage] = useState(null);
    // Form sửa chữa cho từng serial number
    const [instanceRepairForm] = Form.useForm();
    // Device instances (serial numbers)
    const [deviceInstances, setDeviceInstances] = useState([]);
    const [loadingInstances, setLoadingInstances] = useState(false);

    // repair states
    const [showRepairModal, setShowRepairModal] = useState(false);
    const [repairLoading, setRepairLoading] = useState(false);
    const [existingRepair, setExistingRepair] = useState(null);
    const [selectedInstance, setSelectedInstance] = useState(null);

    const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
    const [repairHistory, setRepairHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [selectedHistoryInstance, setSelectedHistoryInstance] = useState(null);
    const [repairWarning, setRepairWarning] = useState(false);
    const [repairTimes, setRepairTimes] = useState(0);

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

    // =================== LOAD DEVICE INSTANCES ===================
    useEffect(() => {
        if (!device?._id) return;

        const fetchDeviceInstances = async () => {
            try {
                setLoadingInstances(true);
                // Chỉ lấy các thiết bị đang ở phòng lab
                const response = await api.get(`/school-admin/devices/${device._id}/instances?location=lab&limit=1000`);
                if (response.success) {
                    setDeviceInstances(response.data || []);
                }
            } catch (err) {
                console.error("Fetch device instances error:", err);
            } finally {
                setLoadingInstances(false);
            }
        };

        fetchDeviceInstances();
    }, [device]);

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

    // =================== OPEN REPAIR HISTORY ===================
    const openRepairHistory = async (instance) => {
        setSelectedHistoryInstance(instance);
        setShowHistoryDrawer(true);
        setHistoryLoading(true);

        try {
            const res = await api.get(`/repairs/instance/${instance._id}`);

            if (res.success) {
                setRepairHistory(res.data.repairs || []);
                setRepairWarning(res.data.warning);
                setRepairTimes(res.data.totalRepairTimes || 0);
            }
        } catch (err) {
            message.error("Không thể tải lịch sử sửa chữa");
        } finally {
            setHistoryLoading(false);
        }
    };


    // =================== HANDLE INSTANCE REPAIR SUBMIT ===================
    const handleInstanceRepairSubmit = async (values) => {
        if (!selectedInstance) {
            message.error("Không xác định được thiết bị cần sửa.");
            return;
        }

        setRepairLoading(true);

        const formData = new FormData();
        formData.append("device_id", device._id);
        formData.append("inventory_id", inventory._id);
        formData.append("reason", values.reason);
        formData.append("symptom", values.symptom || "");
        formData.append("device_instance_id", selectedInstance._id);
        formData.append("serial_number", selectedInstance.serial_number || "");

        if (image) {
            formData.append("image", image);
        }

        try {
            const response = await api.post(
                "/repairs",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    }
                }
            );

            if (response.success) {
                // Cập nhật ngay trạng thái instance trên UI để không cần refresh
                setDeviceInstances((prev) =>
                    prev.map((inst) =>
                        inst._id === selectedInstance._id
                            ? { ...inst, status: "broken" }
                            : inst
                    )
                );

                message.success("Đã tạo yêu cầu sửa chữa cho thiết bị này.");
                setShowRepairModal(false);
                setSelectedInstance(null);
                instanceRepairForm.resetFields();
                setImage(null);
            } else {
                message.error(response.message);
            }

        } catch (err) {
            console.error("Report error:", err);
            message.error("Có lỗi xảy ra khi tạo yêu cầu sửa chữa");
        } finally {
            setRepairLoading(false);
        }
    };

    if (loading) return <p className="loading">Đang tải dữ liệu...</p>;
    if (!device || !inventory)
        return <p className="error">Không tìm thấy thiết bị.</p>;

    // Tính toán thống kê từ device instances thực tế ở lab
    const labInstances = deviceInstances.filter(inst => inst.location === 'lab');
    const totalLab = labInstances.length;
    const availableLab = labInstances.filter(inst => inst.status === 'available').length;
    const borrowedLab = labInstances.filter(inst => inst.status === 'borrowed').length;
    // Xem cả 'repairing' như thiết bị hỏng để dễ quan sát
    const brokenLab = labInstances.filter(inst => inst.status === 'broken' || inst.status === 'repairing').length;

    // Chỉ sử dụng số liệu từ device instances (không dùng inventory để tránh nhảy state)
    const stats = {
        total: totalLab,
        available: availableLab,
        borrowed: borrowedLab,
        broken: brokenLab,
    };

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
                                    <span className="inventory-value">{stats.total}</span>
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
                                    <span className="inventory-value">{stats.available}</span>
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
                                    <span className="inventory-value">{stats.borrowed}</span>
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
                                    <span className="inventory-value">{stats.broken}</span>
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
                                        {stats.total > 0 ? Math.round((stats.available / stats.total) * 100) : 0}%
                                    </span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-fill available" style={{ width: `${stats.total > 0 ? (stats.available / stats.total) * 100 : 0}%` }}></div>
                                </div>
                            </div>

                            <div className="progress-item">
                                <div className="progress-label">
                                    <span>Đang mượn</span>
                                    <span className="progress-percent">
                                        {stats.total > 0 ? Math.round((stats.borrowed / stats.total) * 100) : 0}%
                                    </span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-fill borrowed" style={{ width: `${stats.total > 0 ? (stats.borrowed / stats.total) * 100 : 0}%` }}></div>
                                </div>
                            </div>

                            <div className="progress-item">
                                <div className="progress-label">
                                    <span>Hỏng</span>
                                    <span className="progress-percent">
                                        {stats.total > 0 ? Math.round((stats.broken / stats.total) * 100) : 0}%
                                    </span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-fill broken" style={{ width: `${stats.total > 0 ? (stats.broken / stats.total) * 100 : 0}%` }}></div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* DEVICE INSTANCES TABLE */}
                    <div className="instances-section" style={{ marginTop: 24 }}>
                        <h3 className="section-title">Danh sách mã thiết bị</h3>
                        <Table
                            dataSource={deviceInstances}
                            loading={loadingInstances}
                            rowKey="_id"
                            pagination={{ pageSize: 10 }}
                            columns={[
                                {
                                    title: 'STT',
                                    key: 'index',
                                    width: 50,
                                    align: 'center',
                                    render: (_, __, index) => index + 1,
                                },
                                {
                                    title: 'Mã Serial Number',
                                    dataIndex: 'serial_number',
                                    key: 'serial_number',
                                    width: 180,
                                    sorter: (a, b) => {
                                        const serialA = (a.serial_number || '').toLowerCase();
                                        const serialB = (b.serial_number || '').toLowerCase();
                                        return serialA.localeCompare(serialB);
                                    },
                                    render: (_, record) => {
                                        const disabled = record.status === "borrowed" ||
                                            record.status === "broken" ||
                                            record.status === "repairing";

                                        return (
                                            <span
                                                style={{
                                                    color: disabled ? "#9ca3af" : "#1890ff",
                                                    cursor: disabled ? "not-allowed" : "pointer",
                                                    textDecoration: disabled ? "line-through" : "none"
                                                }}
                                                onClick={() => {
                                                    if (disabled) {
                                                        if (record.status === "borrowed") {
                                                            message.warning("Thiết bị đang được mượn, không thể tạo yêu cầu sửa chữa.");
                                                        } else {
                                                            message.warning("Thiết bị đã có yêu cầu sửa chữa.");
                                                        }
                                                        return;
                                                    }

                                                    setSelectedInstance(record);
                                                    setImage(null);
                                                    instanceRepairForm.resetFields();
                                                    setShowRepairModal(true);
                                                }}
                                            >
                                                {record.serial_number}
                                            </span>
                                        );
                                    }
                                },
                                
                                {
                                    title: 'Trạng thái',
                                    dataIndex: 'status',
                                    key: 'status',
                                    width: 110,
                                    align: 'center',
                                    render: (status) => {
                                        const statusMap = {
                                            'available': { label: 'Có sẵn', color: 'green' },
                                            'borrowed': { label: 'Đang mượn', color: 'orange' },
                                            'repairing': { label: 'Đang sửa', color: 'blue' },
                                            'broken': { label: 'Hỏng', color: 'red' },
                                            'retired': { label: 'Ngừng sử dụng', color: 'default' },
                                            'maintenance': { label: 'Bảo trì', color: 'purple' },
                                        };
                                        const config = statusMap[status] || { label: status, color: 'default' };
                                        return <Tag color={config.color}>{config.label}</Tag>;
                                    },
                                },
                                {
                                    title: 'Vị trí',
                                    dataIndex: 'location',
                                    key: 'location',
                                    width: 100,
                                    align: 'center',
                                    render: (location) => {
                                        const locationMap = {
                                            'warehouse': 'Kho tổng',
                                            'lab': 'Lab',
                                            'borrowed': 'Đang mượn',
                                            'repair_shop': 'Cửa hàng sửa chữa',
                                        };
                                        return locationMap[location] || location;
                                    },
                                },
                                {
                                    title: 'Vị trí lưu trữ',
                                    dataIndex: 'storage_position',
                                    key: 'storage_position',
                                    width: 130,
                                    render: (text) => text || '-',
                                },
                                {
                                    title: 'Ngày mua',
                                    dataIndex: 'purchase_date',
                                    key: 'purchase_date',
                                    width: 110,
                                    align: 'center',
                                    render: (date) => date ? new Date(date).toLocaleDateString('vi-VN') : '-',
                                },
                                {
                                    title: 'Bảo hành đến',
                                    dataIndex: 'warranty_until',
                                    key: 'warranty_until',
                                    width: 120,
                                    align: 'center',
                                    render: (date) => {
                                        if (!date) return '-';
                                        const warrantyDate = new Date(date);
                                        const now = new Date();
                                        const isExpired = warrantyDate < now;
                                        const style = isExpired ? { color: '#ff4d4f' } : { color: '#52c41a' };
                                        return <span style={style}>{warrantyDate.toLocaleDateString('vi-VN')}</span>;
                                    },
                                },
                                {
                                    title: 'Hành động',
                                    key: 'actions',
                                    width: 100,
                                    align: 'center',
                                    fixed: 'right',
                                    render: (_, record) => (
                                        <Button
                                            type="link"
                                            size="small"
                                            onClick={() => openRepairHistory(record)}
                                        >
                                            Lịch sử
                                        </Button>
                                    ),
                                }
                            ]}
                            scroll={{ x: 'max-content' }}
                            size="small"
                        />
                    </div>

                </div>

            </div>

            {/* FOOTER */}
            <div className="detail-actions">
                <button className="btn btn-secondary" onClick={() => navigate(-1)}>
                    QUAY LẠI
                </button>
            </div>

            {/* Modal tạo yêu cầu sửa chữa cho từng mã serial */}
            <Modal
                title={
                    selectedInstance
                        ? `Tạo yêu cầu sửa chữa - ${selectedInstance.serial_number}`
                        : "Tạo yêu cầu sửa chữa"
                }
                open={showRepairModal}
                onCancel={() => {
                    setShowRepairModal(false);
                    setSelectedInstance(null);
                    instanceRepairForm.resetFields();
                    setImage(null);
                }}
                footer={null}
                afterClose={() => {
                    setSelectedInstance(null);
                    instanceRepairForm.resetFields();
                    setImage(null);
                }}
            >
                <Form form={instanceRepairForm} layout="vertical" onFinish={handleInstanceRepairSubmit}>
                    <Form.Item
                        label="Lý do hỏng"
                        name="reason"
                        rules={[{ required: true, message: "Vui lòng nhập lý do hỏng" }]}
                    >
                        <Input.TextArea rows={3} placeholder="Ví dụ: Thiết bị bị rơi, không lên nguồn..." />
                    </Form.Item>

                    <Form.Item
                        label="Triệu chứng hỏng"
                        name="symptom"
                        rules={[{ required: true, message: "Vui lòng nhập triệu chứng hỏng" }]}
                    >
                        <Input.TextArea rows={3} placeholder="Mô tả chi tiết triệu chứng khi sử dụng" />
                    </Form.Item>

                    <Form.Item label="Ảnh sản phẩm (tuỳ chọn)">
                        <Upload
                            beforeUpload={(file) => {
                                setImage(file);
                                return false;
                            }}
                            listType="picture"
                            maxCount={1}
                        >
                            <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
                        </Upload>
                    </Form.Item>

                    <Button type="primary" htmlType="submit" block loading={repairLoading}>
                        Gửi yêu cầu sửa chữa
                    </Button>
                </Form>
            </Modal>
            {/* ================= DRAWER LỊCH SỬ SỬA CHỮA ================= */}
            {/* ================= DRAWER LỊCH SỬ SỬA CHỮA ================= */}
            <Drawer
                title={
                    selectedHistoryInstance
                        ? `Lịch sử sửa chữa – ${selectedHistoryInstance.serial_number}`
                        : "Lịch sử sửa chữa"
                }
                open={showHistoryDrawer}
                onClose={() => {
                    setShowHistoryDrawer(false);
                    setSelectedHistoryInstance(null);
                    setRepairHistory([]);
                    setRepairWarning(false);
                    setRepairTimes(0);
                }}
                width="55vw"
            >
                {/* ===== CẢNH BÁO SỬA QUÁ NHIỀU ===== */}
                {repairWarning && (
                    <div
                        style={{
                            marginBottom: 16,
                            padding: "12px 16px",
                            borderRadius: 8,
                            background: "#fff7e6",
                            border: "1px solid #ffd591",
                            color: "#d46b08",
                            fontWeight: 500,
                            lineHeight: 1.6
                        }}
                    >
                        ⚠️ <b>Cảnh báo:</b> Thiết bị này đã được sửa chữa{" "}
                        <b>{repairTimes}</b> lần.
                        <br />
                        Khuyến nghị: xem xét <b>bảo trì đặc biệt</b> hoặc{" "}
                        <b>ngừng sử dụng (retire)</b>.
                    </div>
                )}

                {/* ===== BẢNG LỊCH SỬ ===== */}
                <Table
                    loading={historyLoading}
                    dataSource={repairHistory}
                    rowKey="_id"
                    pagination={{ pageSize: 5 }}
                    size="middle"
                    columns={[
                        {
                            title: "Ngày tạo",
                            dataIndex: "createdAt",
                            width: 150,
                            render: (date) =>
                                date ? new Date(date).toLocaleString("vi-VN") : "-",
                        },
                        {
                            title: "Lý do hỏng",
                            dataIndex: "reason",
                            render: (text) => (
                                <div
                                    style={{
                                        whiteSpace: "normal",
                                        wordBreak: "break-word",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {text || "-"}
                                </div>
                            ),
                        },
                        {
                            title: "Trạng thái",
                            dataIndex: "status",
                            align: "center",
                            width: 120,
                            render: (status) => {
                                const map = {
                                    pending: { label: "Chờ duyệt", color: "orange" },
                                    approved: { label: "Đã duyệt", color: "blue" },
                                    in_progress: { label: "Đang sửa", color: "cyan" },
                                    done: { label: "Hoàn tất", color: "green" },
                                    rejected: { label: "Từ chối", color: "red" },
                                    cannot_repair: { label: "Không thể sửa", color: "volcano" },
                                };
                                const cfg = map[status] || {
                                    label: status,
                                    color: "default",
                                };
                                return <Tag color={cfg.color}>{cfg.label}</Tag>;
                            },
                        },
                        {
                            title: "Ngày duyệt / từ chối",
                            dataIndex: "reviewed_at",
                            width: 160,
                            render: (_, record) =>
                                record.reviewed_at
                                    ? new Date(record.reviewed_at).toLocaleString("vi-VN")
                                    : "-",
                        },
                        {
                            title: "Ngày hoàn thành",
                            dataIndex: "completed_at",
                            width: 160,
                            render: (date) =>
                                date ? (
                                    <span style={{ color: "#52c41a" }}>
                                        {new Date(date).toLocaleString("vi-VN")}
                                    </span>
                                ) : "-",
                        },
                        {
                            title: "Ảnh",
                            dataIndex: "image",
                            align: "center",
                            width: 90,
                            render: (img) =>
                                img ? (
                                    <img
                                        src={img}
                                        alt="Repair"
                                        style={{
                                            width: 48,
                                            height: 48,
                                            objectFit: "cover",
                                            borderRadius: 6,
                                            cursor: "pointer",
                                            border: "1px solid #e5e7eb",
                                        }}
                                        onClick={() => window.open(img, "_blank")}
                                    />
                                ) : "-",
                        },
                    ]}
                />
            </Drawer>


        </div>
    );
}