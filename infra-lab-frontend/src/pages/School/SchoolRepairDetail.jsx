// src/pages/School/SchoolRepairDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Layout,
  Typography,
  Card,
  Tag,
  Button,
  Spin,
  Divider,
  message as antdMessage,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { SCHOOL_ROUTES } from "../../constants/routes";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function SchoolRepairDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [repair, setRepair] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/repairs/${id}`);
      const json = await res.json();
      if (json.success) {
        setRepair(json.data);
      } else {
        antdMessage.error(json.message || "Không tải được dữ liệu");
      }
    } catch (err) {
      console.error(err);
      antdMessage.error("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status) => {
    setUpdating(true);
    try {
      const res = await fetch(`${API_BASE}/repairs/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const json = await res.json();
      if (json.success) {
        antdMessage.success("Cập nhật trạng thái thành công");
        fetchDetail();
      } else {
        antdMessage.error(json.message || "Không cập nhật được trạng thái");
      }
    } catch (err) {
      console.error(err);
      antdMessage.error("Lỗi kết nối server");
    } finally {
      setUpdating(false);
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
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f7fb" }}>
      {/* ----- HEADER ----- */}
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
          onClick={() => navigate(SCHOOL_ROUTES.REPAIRS)}
        >
          Quay lại
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          Chi tiết yêu cầu sửa chữa
        </Title>
      </Header>

      {/* ----- CONTENT ----- */}
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

          {/* Serial number của thiết bị gửi sửa (nếu có) */}
          {(repair.device_instance_id?.serial_number || repair.serial_number) && (
            <>
              <Text strong>Mã Serial Number: </Text>
              <Text>
                {repair.device_instance_id?.serial_number || repair.serial_number}
              </Text>
              <br />
              <Divider />
            </>
          )}

          {repair.device_id?.image && (
            <img
              src={repair.device_id.image}
              alt="Device"
              style={{
                width: "100%",
                maxHeight: 260,
                objectFit: "cover",
                borderRadius: 8,
                marginBottom: 20,
              }}
            />
          )}

          <Divider />

          {typeof repair.quantity !== "undefined" && (
            <>
              <Text strong>Số lượng hỏng: </Text>
              <Text>{repair.quantity}</Text>
              <br />
            </>
          )}

          <Text strong>Lý do: </Text>
          <Text>{repair.reason}</Text>
          <br />

          <Text strong>Trạng thái hiện tại: </Text>
          <Tag color={statusColors[repair.status]}>
            {statusText[repair.status]}
          </Tag>
          <br />

          <Divider />

          <Text>
            <strong>Ngày tạo:</strong>{" "}
            {new Date(repair.createdAt).toLocaleString()}
          </Text>
          <br />

          {repair.reviewed_at && (
            <Text>
              <strong>Ngày duyệt:</strong>{" "}
              {new Date(repair.reviewed_at).toLocaleString()}
            </Text>
          )}
          <br />

          {repair.completed_at && (
            <Text>
              <strong>Ngày hoàn thành:</strong>{" "}
              {new Date(repair.completed_at).toLocaleString()}
            </Text>
          )}

          <Divider />

          {/* ----- ACTION BUTTONS ----- */}
          <div style={{ display: "flex", gap: 12 }}>
            {repair.status === "pending" && (
              <>
                <Button
                  type="primary"
                  loading={updating}
                  onClick={() => updateStatus("approved")}
                >
                  Duyệt yêu cầu
                </Button>
                <Button
                  danger
                  loading={updating}
                  onClick={() => updateStatus("rejected")}
                >
                  Từ chối
                </Button>
              </>
            )}

            {repair.status === "approved" && (
              <Button
                type="dashed"
                loading={updating}
                onClick={() => updateStatus("in_progress")}
              >
                Bắt đầu sửa chữa
              </Button>
            )}

            {repair.status === "in_progress" && (
              <Button
                type="primary"
                loading={updating}
                onClick={() => updateStatus("done")}
              >
                Đánh dấu hoàn thành
              </Button>
            )}
          </div>
        </Card>
      </Content>
    </Layout>
  );
}
