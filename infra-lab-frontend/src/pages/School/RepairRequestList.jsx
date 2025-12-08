import { useEffect, useState } from "react";
import "./RepairRequestList.css";

export default function RepairRequestList() {
  const [repairs, setRepairs] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);

  const fetchRepairs = () => {
    setLoading(true);
    const query =
      statusFilter && statusFilter !== "all"
        ? `?status=${statusFilter}`
        : "";
    fetch(`http://localhost:5000/api/repairs${query}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setRepairs(json.data || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRepairs();
  }, [statusFilter]);

  const updateStatus = async (id, status) => {
    await fetch(`http://localhost:5000/api/repairs/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchRepairs();
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div className="content-wrapper">
      <h2>Yêu cầu sửa chữa thiết bị</h2>

      <div style={{ marginBottom: 16 }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="pending">Đang chờ duyệt</option>
          <option value="approved">Đã duyệt</option>
          <option value="in_progress">Đang sửa</option>
          <option value="done">Đã sửa xong</option>
          <option value="rejected">Từ chối</option>
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
              <td>{r.device_id?.name}</td>
              <td>{r.quantity}</td>
              <td>{r.reason}</td>
              <td>{r.status}</td>
              <td>
                {r.status === "pending" && (
                  <>
                    <button onClick={() => updateStatus(r._id, "approved")}>
                      Duyệt
                    </button>
                    <button onClick={() => updateStatus(r._id, "rejected")}>
                      Từ chối
                    </button>
                  </>
                )}
                {r.status === "approved" && (
                  <button onClick={() => updateStatus(r._id, "in_progress")}>
                    Bắt đầu sửa
                  </button>
                )}
                {r.status === "in_progress" && (
                  <button onClick={() => updateStatus(r._id, "done")}>
                    Đánh dấu hoàn thành
                  </button>
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
