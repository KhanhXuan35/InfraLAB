// src/pages/LabManager/LabManagerRepairDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Layout,
  Typography,
  Card,
  Tag,
  Spin,
  Divider,
  Button,
  Alert,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { LAB_MANAGER_ROUTES } from "../../constants/routes";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function LabManagerRepairDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [repair, setRepair] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/repairs/${id}`);
      const json = await res.json();
      if (json.success) setRepair(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const statusColors = {
    pending: "gold",
    approved: "blue",
    in_progress: "purple",
    done: "green",
    rejected: "red",
  };

  const statusText = {
    pending: "Đang chờ duyệt",
    approved: "Đã duyệt",
    in_progress: "Đang sửa",
    done: "Đã hoàn thành",
    rejected: "Đã từ chối",
  };

  if (loading || !repair)
    return (
      <div style={{ display: "flex", height: "100vh", justifyContent: "center", alignItems: "center" }}>
        <Spin size="large" />
      </div>
    );

  return (
    <Layout style={{ background: "#f5f7fb", minHeight: "100vh" }}>
      <Header
        style={{
          background: "#fff",
          padding: "0 24px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(LAB_MANAGER_ROUTES.REPAIRS)}
        >
          Quay lại
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          Chi tiết yêu cầu sửa chữa
        </Title>
      </Header>

      <Content style={{ padding: 32 }}>
        <Card
          style={{
            maxWidth: 800,
            margin: "0 auto",
            borderRadius: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          <Title level={4}>{repair.device_id?.name}</Title>

          {repair.image && (
            <>
              <Text strong>Ảnh minh chứng:</Text>
              <img
                src={repair.image}
                alt="repair proof"
                style={{
                  width: "100%",
                  maxHeight: 300,
                  objectFit: "contain",
                  borderRadius: 8,
                  marginBottom: 20,
                  marginTop: 10
                }}
              />
              <Divider />
            </>
          )}

          <Divider />

          <Text strong>Số lượng hỏng: </Text>
          <Text>{repair.quantity}</Text>
          <br />

          <Text strong>Lý do: </Text>
          <Text>{repair.reason}</Text>
          <br />

          <Text strong>Trạng thái hiện tại: </Text>
          <Tag color={statusColors[repair.status]}>
            {statusText[repair.status]}
          </Tag>
          <br />

          {/* ✅ Fix: Đổi r thành repair */}
          {repair.status === "rejected" && repair.reason_rejected && (
            <>
              <Divider />
              <Alert
                message="Yêu cầu đã bị từ chối"
                description={
                  <div>
                    <Text strong>Lý do từ chối: </Text>
                    <Text>{repair.reason_rejected}</Text>
                  </div>
                }
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
            </>
          )}

          <Divider />

          <Text>
            <strong>Ngày tạo:</strong>{" "}
            {new Date(repair.createdAt).toLocaleString("vi-VN")}
          </Text>
          <br />

          {repair.reviewed_at && (
            <>
              <Text>
                <strong>Ngày duyệt:</strong>{" "}
                {new Date(repair.reviewed_at).toLocaleString("vi-VN")}
              </Text>
              <br />
            </>
          )}

          {repair.completed_at && (
            <>
              <Text>
                <strong>Ngày hoàn thành:</strong>{" "}
                {new Date(repair.completed_at).toLocaleString("vi-VN")}
              </Text>
              <br />
            </>
          )}
        </Card>
      </Content>
    </Layout>
  );
}