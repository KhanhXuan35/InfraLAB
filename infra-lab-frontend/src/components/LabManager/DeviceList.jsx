import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Input,
  Layout,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import api from "../../services/api";
import LabManagerSidebar from "../Sidebar/LabManagerSidebar";
import "./deviceList.css";

const { Content } = Layout;
const { Title, Text } = Typography;

function DeviceList() {
  const navigate = useNavigate();

  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(undefined);
  const [status, setStatus] = useState(undefined);
  const [categories, setCategories] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Chỉ lấy thiết bị đang ở Lab (đã được duyệt/nhập về Lab)
      const devicesRes = await api.get("/inventory/lab");
      const labInventories = Array.isArray(devicesRes) ? devicesRes : (devicesRes.data || []);

      const sorted = [...labInventories].sort((a, b) => {
        const nameA = (a.device?.name || "").toLowerCase();
        const nameB = (b.device?.name || "").toLowerCase();
        return nameA.localeCompare(nameB, "vi");
      });

      setAllRows(sorted);

      const categoriesRes = await api.get("/categories");
      const cats = Array.isArray(categoriesRes) ? categoriesRes : (categoriesRes.data || []);
      setCategories(cats);
    } catch (error) {
      console.error("Error fetching lab devices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCategoryName = (row) => {
    const dev = row?.device || {};
    if (dev.category_id && typeof dev.category_id === "object" && dev.category_id.name) {
      return dev.category_id.name;
    }
    if (typeof dev.category === "string") return dev.category;
    if (dev.category && typeof dev.category === "object" && dev.category.name) return dev.category.name;
    return "N/A";
  };

  const getBorrowed = (row) => {
    const total = row?.total ?? 0;
    const available = row?.available ?? 0;
    const broken = row?.broken ?? 0;
    if (typeof row?.borrowed === "number") return row.borrowed;
    return Math.max(total - available - broken, 0);
  };

  const filteredRows = useMemo(() => {
    let rows = [...allRows];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((r) => (r.device?.name || "").toLowerCase().includes(q));
    }

    if (category) {
      rows = rows.filter((r) => getCategoryName(r) === category);
    }

    if (status) {
      if (status === "available") rows = rows.filter((r) => (r.available ?? 0) > 0);
      if (status === "borrowed") rows = rows.filter((r) => getBorrowed(r) > 0);
      if (status === "broken") rows = rows.filter((r) => (r.broken ?? 0) > 0);
    }

    const hasNoFilters = !search.trim() && !category && !status;
    if (hasNoFilters) {
      rows.sort((a, b) => {
        const nameA = (a.device?.name || "").toLowerCase();
        const nameB = (b.device?.name || "").toLowerCase();
        return nameA.localeCompare(nameB, "vi");
      });
    }

    return rows;
  }, [allRows, search, category, status]);

  const columns = useMemo(() => [
    {
      title: "#",
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Ảnh",
      key: "image",
      width: 90,
      render: (_, record) => {
        const src = record.device?.image;
        return src ? (
          <img
            src={src}
            alt={record.device?.name || "device"}
            style={{ width: 54, height: 54, objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" }}
            onError={(e) => {
              e.currentTarget.src = "https://via.placeholder.com/60x60?text=No+Image";
            }}
          />
        ) : (
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 8,
              border: "1px dashed #d1d5db",
              background: "#f9fafb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              color: "#9ca3af",
              textAlign: "center",
              padding: 6,
            }}
          >
            No Image
          </div>
        );
      },
    },
    {
      title: "Tên thiết bị",
      key: "name",
      render: (_, record) => <strong>{record.device?.name || "N/A"}</strong>,
    },
    {
      title: "Danh mục",
      key: "category",
      render: (_, record) => <Tag color="blue">{getCategoryName(record)}</Tag>,
    },
    {
      title: "Tổng",
      key: "total",
      align: "center",
      width: 90,
      render: (_, record) => record.total ?? 0,
    },
    {
      title: "Đang rảnh",
      key: "available",
      align: "center",
      width: 110,
      render: (_, record) => <span style={{ color: "#16a34a", fontWeight: 600 }}>{record.available ?? 0}</span>,
    },
    {
      title: "Đang mượn",
      key: "borrowed",
      align: "center",
      width: 110,
      render: (_, record) => <span style={{ color: "#ca8a04", fontWeight: 600 }}>{getBorrowed(record)}</span>,
    },
    {
      title: "Hỏng",
      key: "broken",
      align: "center",
      width: 90,
      render: (_, record) => <span style={{ color: "#dc2626", fontWeight: 600 }}>{record.broken ?? 0}</span>,
    },
    {
      title: "Hành động",
      key: "action",
      align: "center",
      width: 140,
      render: (_, record) => (
        <Button type="primary" onClick={() => navigate(`/lab-manager/device/${record._id}`)}>
          Chi tiết
        </Button>
      ),
    },
  ], [navigate]);

  return (
    <Layout className="lab-manager-devices-page" style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <LabManagerSidebar />
      <Layout style={{ marginLeft: 240, background: "#f5f5f5" }}>
        <Content style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
          <Card style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: "100%" }} size={4}>
              <Title level={3} style={{ margin: 0 }}>Quản lý thiết bị (Phòng Lab)</Title>
              <Text type="secondary">
                Chỉ hiển thị thiết bị đã được duyệt và đang có trong phòng Lab.
              </Text>
            </Space>
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <Space wrap style={{ width: "100%" }}>
              <Input
                style={{ flex: "1 1 280px", minWidth: 260 }}
                placeholder="Tìm theo tên thiết bị..."
                prefix={<SearchOutlined />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                allowClear
              />

              <Select
                style={{ width: 220 }}
                placeholder="Tất cả danh mục"
                value={category}
                onChange={setCategory}
                allowClear
                options={(categories || []).map((c) => ({ label: c.name, value: c.name }))}
              />

              <Select
                style={{ width: 220 }}
                placeholder="Tất cả trạng thái"
                value={status}
                onChange={setStatus}
                allowClear
                options={[
                  { label: "Đang rảnh > 0", value: "available" },
                  { label: "Đang mượn > 0", value: "borrowed" },
                  { label: "Hỏng > 0", value: "broken" },
                ]}
              />

              <Button icon={<ReloadOutlined />} onClick={() => { setSearch(""); setCategory(undefined); setStatus(undefined); }}>
                Reset
              </Button>
              <Button onClick={fetchData}>Tải lại</Button>
            </Space>
          </Card>

          <Card>
            <Table
              rowKey={(r) => r._id}
              loading={loading}
              dataSource={filteredRows}
              columns={columns}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              scroll={{ x: 900 }}
            />
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
}

export default DeviceList;
