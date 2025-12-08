import { useEffect, useState } from "react";
import "./RepairRequestList.css";

export default function RepairRequestList() {
  const [repairs, setRepairs] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null); 
  const [message, setMessage] = useState({ type: "", text: "" });

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

  if (loading) return <div style={{ padding: "20px", textAlign: "center" }}>Đang tải...</div>;

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
            border: `1px solid ${
              message.type === "success" 
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
                  <span style={{ color: "#999", fontSize: "14px" }}>
                    {r.status === "done" ? "Đã hoàn thành" : "Đã từ chối"}
                  </span>
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
  );
}
