import { useEffect, useState } from "react";
import { Layout, Menu, Typography, Button, Modal } from "antd";
import {
  DashboardOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import "./RepairRequestList.css";

export default function RepairRequestList() {
  const navigate = useNavigate();
  const [repairs, setRepairs] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [previewImage, setPreviewImage] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const fetchRepairs = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const query =
        statusFilter && statusFilter !== "all"
          ? `?status=${statusFilter}`
          : "";
      const url = `${API_BASE}/repairs${query}`;
      console.log("Fetching repairs from:", url);

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const json = await res.json();
      console.log("Repairs response:", json);

      if (json.success) {
        setRepairs(json.data || []);
        if ((json.data || []).length === 0) {
          setMessage({ type: "info", text: "Không có yêu cầu nào trong trạng thái này." });
        }
      } else {
        setMessage({ type: "error", text: json.message || "Không thể tải danh sách yêu cầu" });
      }
    } catch (error) {
      console.error("Error fetching repairs:", error);
      let errorMessage = "Lỗi kết nối đến server";

      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        errorMessage = "Không thể kết nối đến server. Vui lòng kiểm tra xem backend đã chạy chưa.";
      } else if (error.message.includes("HTTP error")) {
        errorMessage = `Lỗi server: ${error.message}`;
      }

      setMessage({ type: "error", text: errorMessage });
      setRepairs([]); // Clear repairs on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepairs();
  }, [statusFilter]);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    setMessage({ type: "", text: "" });

    try {
      const url = `${API_BASE}/repairs/${id}/status`;
      console.log("Updating repair status:", url, { status });

      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const json = await res.json();
      console.log("Update response:", json);

      if (json.success) {
        const statusText = {
          approved: "đã duyệt",
          rejected: "đã từ chối",
          in_progress: "đã bắt đầu sửa",
          done: "đã hoàn thành"
        }[status] || "đã cập nhật";

        setMessage({
          type: "success",
          text: `Yêu cầu đã được ${statusText} thành công!`
        });

        // Tự động ẩn thông báo sau 3 giây
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);

        // Làm mới danh sách
        await fetchRepairs();
      } else {
        setMessage({
          type: "error",
          text: json.message || "Không thể cập nhật trạng thái"
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      let errorMessage = "Lỗi kết nối đến server. Vui lòng thử lại.";

      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        errorMessage = "Không thể kết nối đến server. Vui lòng kiểm tra xem backend đã chạy chưa.";
      } else if (error.message.includes("HTTP error")) {
        errorMessage = `Lỗi server: ${error.message}`;
      }

      setMessage({
        type: "error",
        text: errorMessage
      });
    } finally {
      setUpdating(null);
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: "Đang chờ duyệt",
      approved: "Đã duyệt",
      in_progress: "Đang sửa",
      done: "Đã sửa xong",
      rejected: "Đã từ chối"
    };
    return statusMap[status] || status;
  };

  const getStatusBadgeClass = (status) => {
    const classMap = {
      pending: "status-pending",
      approved: "status-approved",
      in_progress: "status-in-progress",
      done: "status-done",
      rejected: "status-rejected"
    };
    return classMap[status] || "";
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout.Sider
        width={240}
        style={{
          background: "#001529",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          overflow: "auto",
        }}
      >
        <div
          style={{
            padding: 24,
            textAlign: "center",
            borderBottom: "1px solid #303030",
          }}
        >
          <Typography.Title level={4} style={{ color: "#fff", margin: 0 }}>
            InFra<span style={{ color: "#1890ff" }}>Lab</span>
          </Typography.Title>
          <Typography.Text type="secondary" style={{ color: "#8c8c8c", fontSize: 12 }}>
            QUẢN TRỊ HỆ THỐNG
          </Typography.Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={["requests"]}
          items={[
            { key: "overview", icon: <DashboardOutlined />, label: "Tổng quan" },
            { key: "devices", icon: <ToolOutlined />, label: "Quản lý thiết bị" },
            { key: "requests", icon: <CheckCircleOutlined />, label: "Danh sách sửa chữa" },
            { key: "reports", icon: <FileTextOutlined />, label: "Báo cáo" },
            { key: "notifications", icon: <BellOutlined />, label: "Thông báo" },
          ]}
          style={{ borderRight: 0, marginTop: 16 }}
          onSelect={({ key }) => {
            if (key === "overview") navigate("/school-dashboard");
            else if (key === "devices") navigate("/school/dashboard");
            else if (key === "requests") navigate("/requests");
            else if (key === "reports") navigate("/reports");
            else if (key === "notifications") navigate("/notifications");
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: 16,
            borderTop: "1px solid #303030",
            cursor: "pointer",
          }}
          onClick={() => {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
            navigate("/login");
          }}
        >
          <Button
            type="text"
            icon={<LogoutOutlined />}
            style={{ width: "100%", color: "#fff" }}
          >
            Đăng xuất
          </Button>
        </div>
      </Layout.Sider>

      <Layout style={{ marginLeft: 240, background: "#0c1424", minHeight: "100vh" }}>
        <Layout.Content style={{ padding: "24px" }}>
          <div className="content-wrapper">
            <h2>Yêu cầu sửa chữa thiết bị</h2>

            {/* Thông báo */}
            {message.text && (
              <div
                style={{
                  padding: "12px 16px",
                  marginBottom: "16px",
                  borderRadius: "4px",
                  backgroundColor: message.type === "success"
                    ? "#d4edda"
                    : message.type === "info"
                      ? "#d1ecf1"
                      : "#f8d7da",
                  color: message.type === "success"
                    ? "#155724"
                    : message.type === "info"
                      ? "#0c5460"
                      : "#721c24",
                  border: `1px solid ${message.type === "success"
                    ? "#c3e6cb"
                    : message.type === "info"
                      ? "#bee5eb"
                      : "#f5c6cb"
                    }`,
                }}
              >
                {message.text}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ marginRight: "8px", fontWeight: "500" }}>Lọc theo trạng thái:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                  minWidth: "200px"
                }}
              >
                <option value="pending">Đang chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="in_progress">Đang sửa</option>
                <option value="done">Đã sửa xong</option>
                <option value="rejected">Đã từ chối</option>
                <option value="all">Tất cả</option>
              </select>
            </div>

            <table className="device-table">
              <thead>
                <tr>
                  <th>Thiết bị</th>
                  <th>Số lượng</th>
                  <th>Lý do</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                  <th>Ảnh</th>
                </tr>
              </thead>
              <tbody>
                {repairs.map((r) => (
                  <tr key={r._id}>
                    <td>{r.device_id?.name || "N/A"}</td>
                    <td>{r.quantity || 1}</td>
                    <td>{r.reason || "Không có"}</td>
                    <td>
                      <span className={getStatusBadgeClass(r.status)} style={{
                        padding: "4px 12px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "500",
                        display: "inline-block"
                      }}>
                        {getStatusText(r.status)}
                      </span>
                    </td>
                    <td>
                      {r.status === "pending" && (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => updateStatus(r._id, "approved")}
                            disabled={updating === r._id}
                            style={{
                              padding: "6px 16px",
                              backgroundColor: "#1890ff",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: updating === r._id ? "not-allowed" : "pointer",
                              opacity: updating === r._id ? 0.6 : 1,
                              fontSize: "14px",
                              fontWeight: "500"
                            }}
                          >
                            {updating === r._id ? "Đang xử lý..." : "Duyệt"}
                          </button>
                          <button
                            onClick={() => updateStatus(r._id, "rejected")}
                            disabled={updating === r._id}
                            style={{
                              padding: "6px 16px",
                              backgroundColor: "#ff4d4f",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: updating === r._id ? "not-allowed" : "pointer",
                              opacity: updating === r._id ? 0.6 : 1,
                              fontSize: "14px",
                              fontWeight: "500"
                            }}
                          >
                            {updating === r._id ? "Đang xử lý..." : "Từ chối"}
                          </button>
                        </div>
                      )}
                      {r.status === "approved" && (
                        <button
                          onClick={() => updateStatus(r._id, "in_progress")}
                          disabled={updating === r._id}
                          style={{
                            padding: "6px 16px",
                            backgroundColor: "#52c41a",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: updating === r._id ? "not-allowed" : "pointer",
                            opacity: updating === r._id ? 0.6 : 1,
                            fontSize: "14px",
                            fontWeight: "500"
                          }}
                        >
                          {updating === r._id ? "Đang xử lý..." : "Bắt đầu sửa"}
                        </button>
                      )}
                      {r.status === "in_progress" && (
                        <button
                          onClick={() => updateStatus(r._id, "done")}
                          disabled={updating === r._id}
                          style={{
                            padding: "6px 16px",
                            backgroundColor: "#722ed1",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: updating === r._id ? "not-allowed" : "pointer",
                            opacity: updating === r._id ? 0.6 : 1,
                            fontSize: "14px",
                            fontWeight: "500"
                          }}
                        >
                          {updating === r._id ? "Đang xử lý..." : "Đánh dấu hoàn thành"}
                        </button>
                      )}
                      {(r.status === "done" || r.status === "rejected") && (
                        <span style={{ color: "#d8c9c9ff", fontSize: "14px" }}>
                          {r.status === "done" ? "Đã hoàn thành" : "Đã từ chối"}
                        </span>
                      )}
                    </td>
                    <td>
                      {r.image ? (
                        <img
                          src={r.image}
                          onClick={() => {
                            setPreviewImage(r.image);
                            setPreviewOpen(true);
                          }}
                          style={{
                            width: "60px",
                            height: "60px",
                            borderRadius: "6px",
                            objectFit: "cover",
                            border: "1px solid #444",
                            cursor: "pointer"
                          }}
                        />
                      ) : (
                        <span style={{ color: "#888" }}>Không có ảnh</span>
                      )}
                    </td>


                  </tr>
                ))}

                {repairs.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center" }}>
                      Không có yêu cầu nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Modal xem ảnh */}
          <Modal
            open={previewOpen}
            footer={null}
            onCancel={() => setPreviewOpen(false)}
            width={700}
          >
            <img
              src={previewImage}
              style={{
                width: "100%",
                borderRadius: "10px",
                objectFit: "contain",
              }}
              alt="preview"
            />
          </Modal>

        </Layout.Content>
      </Layout>
    </Layout>
  );
}
