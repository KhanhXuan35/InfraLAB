import React, { useEffect, useState } from "react";
import {
  Table,
  Card,
  Typography,
  Button,
  Input,
  Select,
  Tag,
  Image,
  Row,
  Col,
  Tooltip,
  Space
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./deviceList.css";

// Lưu ý: Đảm bảo file css không set style global đè lên layout chính

const { Title } = Typography;
const { Option } = Select;

function DeviceList() {
  const navigate = useNavigate();

  // --- STATE DỮ LIỆU ---
  const [allDevices, setAllDevices] = useState([]); // Dữ liệu gốc
  const [filteredDevices, setFilteredDevices] = useState([]); // Dữ liệu sau khi lọc (hiển thị lên bảng)
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- STATE BỘ LỌC ---
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");

  // --- HÀM LẤY DỮ LIỆU ---
  const fetchData = async () => {
    setLoading(true);
    try {
      // Gọi song song 2 API để tối ưu tốc độ
      const [devicesRes, categoriesRes] = await Promise.all([
        api.get('/inventory/lab'),
        api.get('/categories')
      ]);

      if (devicesRes.data) {
        setAllDevices(devicesRes.data || []);
        setFilteredDevices(devicesRes.data || []); // Ban đầu hiển thị hết
      }

      if (categoriesRes.data) {
        setCategories(categoriesRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- LOGIC LỌC DỮ LIỆU (Chạy mỗi khi search/category/status thay đổi) ---
  useEffect(() => {
    let result = [...allDevices];

    // 1. Lọc theo tên
    if (search.trim()) {
      result = result.filter(item =>
        item.device?.name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // 2. Lọc theo danh mục
    if (category !== "all") {
      result = result.filter(item => item.device?.category === category);
    }

    // 3. Lọc theo trạng thái
    if (status !== "all") {
      if (status === "available") result = result.filter((d) => d.available > 0);
      if (status === "borrowed") result = result.filter((d) => d.borrowed > 0);
      if (status === "broken") result = result.filter((d) => d.broken > 0);
    }

    setFilteredDevices(result);
  }, [search, category, status, allDevices]);

  // Reset bộ lọc
  const handleReset = () => {
    setSearch("");
    setCategory("all");
    setStatus("all");
  };

  // --- CẤU HÌNH CỘT BẢNG ---
  const columns = [
    {
      title: '#',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Ảnh',
      dataIndex: ['device', 'image'],
      key: 'image',
      width: 100,
      align: 'center',
      render: (img) => (
        <Image
          width={50}
          height={50}
          src={img}
          fallback="https://via.placeholder.com/50x50?text=No+Image"
          style={{ objectFit: 'cover', borderRadius: '4px', border: '1px solid #f0f0f0' }}
        />
      ),
    },
    {
      title: 'Tên thiết bị',
      dataIndex: ['device', 'name'],
      key: 'name',
      render: (text) => <b>{text}</b>,
    },
    {
      title: 'Danh mục',
      dataIndex: ['device', 'category'],
      key: 'category',
      render: (cat) => <Tag color="blue">{cat}</Tag>,
    },
    {
      title: 'Tổng',
      dataIndex: 'total',
      key: 'total',
      width: 80,
      align: 'center',
      sorter: (a, b) => a.total - b.total,
    },
    {
      title: 'Rảnh',
      dataIndex: 'available',
      key: 'available',
      width: 80,
      align: 'center',
      render: (val) => <span style={{ color: '#52c41a', fontWeight: 'bold' }}>{val}</span>,
    },
    {
      title: 'Mượn',
      dataIndex: 'borrowed',
      key: 'borrowed',
      width: 80,
      align: 'center',
      render: (val) => <span style={{ color: '#faad14', fontWeight: 'bold' }}>{val}</span>,
    },
    {
      title: 'Hỏng',
      dataIndex: 'broken',
      key: 'broken',
      width: 80,
      align: 'center',
      render: (val) => <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{val}</span>,
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'center',
      width: 120,
      render: (_, record) => (
        <Tooltip title="Xem chi tiết">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => navigate(`/lab-manager/device/${record._id}`)}
          >
            Chi tiết
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="device-list-content">
      {/* HEADER PAGE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0, color: '#001529' }}>📦 Quản Lý Thiết Bị</Title>
        <Button icon={<ReloadOutlined />} onClick={fetchData}>Làm mới</Button>
      </div>

      <Card bordered={false} className="shadow-sm">
        {/* FILTER TOOLBAR */}
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={24} md={8}>
            <Input
              placeholder="Tìm theo tên thiết bị..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} md={5}>
            <Select
              style={{ width: '100%' }}
              value={category}
              onChange={setCategory}
              placeholder="Chọn danh mục"
            >
              <Option value="all">Tất cả danh mục</Option>
              {categories.map((c) => (
                <Option key={c._id} value={c.name}>{c.name}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={5}>
            <Select
              style={{ width: '100%' }}
              value={status}
              onChange={setStatus}
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="available">Còn hàng (Available)</Option>
              <Option value="borrowed">Đang mượn (Borrowed)</Option>
              <Option value="broken">Hỏng (Broken)</Option>
            </Select>
          </Col>
          <Col xs={24} md={6} style={{ textAlign: 'right' }}>
            <Button onClick={handleReset}>Reset bộ lọc</Button>
          </Col>
        </Row>

        {/* DATA TABLE */}
        <Table
          columns={columns}
          dataSource={filteredDevices}
          rowKey="_id"
          loading={loading}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20', '50'],
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} thiết bị`
          }}
          scroll={{ x: 1000 }} // Hỗ trợ cuộn ngang trên mobile
        />
      </Card>
    </div>
  );
}

export default DeviceList;