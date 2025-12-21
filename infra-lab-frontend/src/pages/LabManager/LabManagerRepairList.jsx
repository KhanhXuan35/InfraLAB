// src/pages/LabManager/LabManagerRepairList.jsx
import { useEffect, useState } from "react";
import { Layout, Typography, Table, Tag, Button } from "antd";
import { LAB_MANAGER_ROUTES } from "../../constants/routes";
import { useNavigate } from "react-router-dom";

const { Header, Content } = Layout;
const { Title } = Typography;

export default function LabManagerRepairList() {
    const navigate = useNavigate();
    const [repairs, setRepairs] = useState([]);
    const [loading, setLoading] = useState(true);

    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

    const fetchRepairs = async () => {
        setLoading(true);
        try {
            // nếu backend chưa có /my thì tạm dùng /?status=all
            const res = await fetch(`${API_BASE}/repairs?status=all`);
            const json = await res.json();
            if (json.success) {
                setRepairs(json.data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRepairs();
    }, []);

    const statusText = {
        pending: "Đang chờ duyệt",
        approved: "Đã duyệt",
        in_progress: "Đang sửa",
        done: "Đã sửa xong",
        rejected: "Đã từ chối",
    };

    const columns = [
        {
            title: "Ảnh",
            dataIndex: "device_id",
            key: "image",
            width: 80,
            render: (device) =>
                device?.image ? (
                    <img
                        src={device.image}
                        alt={device.name}
                        style={{
                            width: 50,
                            height: 50,
                            objectFit: 'cover',
                            borderRadius: 4,
                        }}
                        onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/50?text=No+Image';
                        }}
                    />
                ) : (
                    <div style={{
                        width: 50,
                        height: 50,
                        backgroundColor: '#f0f0f0',
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        color: '#999',
                    }}>
                        No Image
                    </div>
                ),
        },
        {
            title: "Thiết bị",
            dataIndex: "device_id",
            key: "device",
            render: (device) => device?.name || "N/A",
        },
        {
            title: "Mã Serial",
            key: "serial",
            width: 150,
            render: (_, record) => {
                const serialNumber = record.device_instance_id?.serial_number || record.serial_number || "N/A";
                return (
                    <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 500 }}>
                        {serialNumber}
                    </span>
                );
            },
        },
        {
            title: "Số lượng",
            dataIndex: "quantity",
            key: "quantity",
            width: 100,
        },
        {
            title: "Lý do",
            dataIndex: "reason",
            key: "reason",
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            width: 140,
            render: (status) => {
                const colorMap = {
                    pending: "gold",
                    approved: "blue",
                    in_progress: "purple",
                    done: "green",
                    rejected: "red",
                };
                return <Tag color={colorMap[status]}>{statusText[status]}</Tag>;
            },
        }, {
            title: "Hành động",
            key: "action",
            width: 140,
            render: (_, record) => (
                <Button
                    type="primary"
                    onClick={() => navigate(`/lab-manager/repairs/${record._id}`)}
                >
                    Chi tiết
                </Button>
            ),
        },
    ];

    return (
        <Layout style={{ minHeight: "100vh", background: "#f5f7fb" }}>
            <Header
                style={{
                    background: "#ffffff",
                    padding: "0 24px",
                    borderBottom: "1px solid #e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <Title level={4} style={{ margin: 0 }}>
                    Yêu cầu sửa chữa đã gửi
                </Title>
                <Button onClick={() => navigate(LAB_MANAGER_ROUTES.REPORTS)}>
                    Về dashboard
                </Button>
            </Header>

            <Content style={{ padding: "24px 32px" }}>
                <div
                    style={{
                        background: "#ffffff",
                        padding: 24,
                        borderRadius: 12,
                        boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
                    }}
                >
                    <Title level={5}>Danh sách yêu cầu</Title>
                    <Table
                        rowKey="_id"
                        columns={columns}
                        dataSource={repairs}
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                    />
                </div>
            </Content>
        </Layout>
    );
}
