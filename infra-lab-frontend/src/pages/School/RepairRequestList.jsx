import { useEffect, useState } from "react";
import { Button, Modal, Input, message, Table, Tag, Space, Card, Select } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import "./RepairRequestList.css";

// Lưu ý: Đảm bảo file css không set style global đè lên layout chính

export default function RepairRequestList() {
  const [repairs, setRepairs] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  // State Modal Preview Ảnh
  const [previewImage, setPreviewImage] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // State Modal Từ Chối
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedRepairId, setSelectedRepairId] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const fetchRepairs = async () => {
    setLoading(true);
    try {
      const query = statusFilter && statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const url = `${API_BASE}/repairs${query}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const json = await res.json();
      if (json.success) {
        setRepairs(json.data || []);
      } else {
        message.error(json.message || "Không thể tải danh sách yêu cầu");
      }
    } catch (error) {
      console.error("Error fetching repairs:", error);
      message.error("Lỗi kết nối đến server");
      setRepairs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepairs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const updateStatus = async (id, status, reason_rejected = null) => {
    setUpdating(id);
    try {
      const url = `${API_BASE}/repairs/${id}/status`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason_rejected }),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();

      if (json.success) {
        const statusText = {
          approved: "đã duyệt",
          rejected: "đã từ chối",
          in_progress: "đã bắt đầu sửa",
          done: "đã hoàn thành"
        }[status] || "đã cập nhật";

        message.success(`Yêu cầu ${statusText} thành công!`);
        await fetchRepairs(); // Reload data
      } else {
        message.error(json.message || "Không thể cập nhật trạng thái");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      message.error("Lỗi cập nhật trạng thái");
    } finally {
      setUpdating(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      message.error("Vui lòng nhập lý do từ chối!");
      return;
    }
    await updateStatus(selectedRepairId, "rejected", rejectReason);
    setRejectModalOpen(false);
    setRejectReason("");
    setSelectedRepairId(null);
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: "orange", text: "Đang chờ duyệt" },
      approved: { color: "blue", text: "Đã duyệt" },
      in_progress: { color: "processing", text: "Đang sửa" },
      done: { color: "success", text: "Đã sửa xong" },
      rejected: { color: "error", text: "Đã từ chối" }
    };
    const s = statusMap[status] || { color: "default", text: status };
    return <Tag color={s.color}>{s.text}</Tag>;
  };

  // Cấu hình cột cho bảng Ant Design Table
  const columns = [
    {
      title: 'Thiết bị',
      dataIndex: ['device_id', 'name'],
      key: 'device_name',
      render: (text, record) => record.device_id?.name || "N/A",
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (qty) => qty || 1,
    },
    {
      title: 'Lý do',
      dataIndex: 'reason',
      key: 'reason',
      render: (text) => text || "Không có",
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Ảnh',
      dataIndex: 'image',
      key: 'image',
      width: 100,
      render: (img) => img ? (
        <img
          src={img}
          alt="hỏng"
          style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4, cursor: 'pointer', border: '1px solid #ddd' }}
          onClick={() => { setPreviewImage(img); setPreviewOpen(true); }}
        />
      ) : <span style={{ color: '#999' }}>Không có</span>
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          {record.status === "pending" && (
            <>
              <Button
                type="primary"
                size="small"
                loading={updating === record._id}
                onClick={() => updateStatus(record._id, "approved")}
              >
                Duyệt
              </Button>
              <Button
                danger
                size="small"
                loading={updating === record._id}
                onClick={() => { setSelectedRepairId(record._id); setRejectModalOpen(true); }}
              >
                Từ chối
              </Button>
            </>
          )}
          {record.status === "approved" && (
            <Button
              type="primary"
              ghost
              size="small"
              loading={updating === record._id}
              onClick={() => updateStatus(record._id, "in_progress")}
            >
              Bắt đầu sửa
            </Button>
          )}
          {record.status === "in_progress" && (
            <Button
              type="primary"
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              size="small"
              loading={updating === record._id}
              onClick={() => updateStatus(record._id, "done")}
            >
              Hoàn thành
            </Button>
          )}
          {(record.status === "done" || record.status === "rejected") && (
            <Button size="small" disabled>Đã kết thúc</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="repair-request-list-content">
      <h2 style={{ marginBottom: '20px', color: '#001529' }}>📋 Danh Sách Yêu Cầu Sửa Chữa</h2>

      {/* Filter Section */}
      <Card style={{ marginBottom: 20 }} bodyStyle={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontWeight: 500 }}>Lọc theo trạng thái:</span>
          <Select
            defaultValue="pending"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 200 }}
            options={[
              { value: 'pending', label: 'Đang chờ duyệt' },
              { value: 'approved', label: 'Đã duyệt' },
              { value: 'in_progress', label: 'Đang sửa' },
              { value: 'done', label: 'Đã sửa xong' },
              { value: 'rejected', label: 'Đã từ chối' },
              { value: 'all', label: 'Tất cả' },
            ]}
          />
          <Button onClick={fetchRepairs} loading={loading}>Làm mới</Button>
        </div>
      </Card>

      {/* Table Section */}
      <Card bodyStyle={{ padding: 0 }}>
        <Table
          dataSource={repairs}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: "Không có yêu cầu nào" }}
        />
      </Card>

      {/* Modal Preview Ảnh */}
      <Modal
        open={previewOpen}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        width={700}
        centered
      >
        <img
          src={previewImage}
          style={{ width: "100%", borderRadius: "8px" }}
          alt="preview"
        />
      </Modal>

      {/* Modal Từ Chối */}
      <Modal
        title="Lý do từ chối"
        open={rejectModalOpen}
        onCancel={() => {
          setRejectModalOpen(false);
          setRejectReason("");
          setSelectedRepairId(null);
        }}
        onOk={handleReject}
        okText="Từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <Input.TextArea
          rows={4}
          placeholder="Nhập lý do từ chối..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          style={{ marginTop: 16 }}
        />
      </Modal>
    </div>
  );
}