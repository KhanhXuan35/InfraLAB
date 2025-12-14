import React, { useEffect, useMemo, useState } from 'react';
import {
  Table, Card, Button, Input, Select, Modal,
  Form, InputNumber, Space, Tag, Popconfirm,
  message, Typography, Row, Col, Tooltip
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import '../dashboard.css'; // Giữ lại nếu có style global, nhưng ant design đã lo phần lớn style

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

function SchoolDashboard() {
  // --- STATE ---
  const [activeSection, setActiveSection] = useState('inventory');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [categories, setCategories] = useState([]);
  const [devices, setDevices] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState('all');
  const [loading, setLoading] = useState(false);

  // State Modal & Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Sử dụng Form Hook của Antd để quản lý form dễ hơn
  const [form] = Form.useForm();

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // --- LOAD DATA ---
  const loadData = async () => {
    setLoading(true);
    try {
      const locationFilter = 'warehouse';
      const [catRes, devRes, invRes] = await Promise.all([
        fetch(`${API_BASE}/device-categories`),
        fetch(`${API_BASE}/devices?location=${locationFilter}`),
        fetch(`${API_BASE}/inventories`)
      ]);

      if (!catRes.ok || !devRes.ok) throw new Error('Lỗi khi tải dữ liệu');

      const catData = await catRes.json();
      const devData = await devRes.json();

      const categoriesList = Array.isArray(catData) ? catData : (catData?.data || []);
      const devicesList = Array.isArray(devData) ? devData : (devData?.data || []);

      setCategories(categoriesList);
      setDevices(devicesList);

      if (invRes.ok) {
        const invData = await invRes.json();
        const inventoriesList = Array.isArray(invData) ? invData : (invData?.data || []);
        setInventories(inventoriesList);
      }
    } catch (err) {
      message.error(err.message || 'Đã có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- FILTER & SORT LOGIC ---
  const filteredData = useMemo(() => {
    if (!devices || !Array.isArray(devices)) return [];

    const list = devices.map(device => {
      // Merge inventory data directly into device object for Table rendering
      const devId = device._id || device.id || '';
      const inv = inventories.find((i) => {
        const iDev = i.device_id?._id || i.device_id || '';
        return String(iDev) === String(devId);
      });

      return {
        ...device,
        total: inv?.total ?? 0,
        available: inv?.available ?? 0,
        broken: inv?.broken ?? 0,
        location: inv?.location || 'warehouse',
        inventory_id: inv?._id // keep track if needed
      };
    }).filter((item) => {
      // Filter Logic
      const nameMatches = (item.name || '').toLowerCase().includes((search || '').toLowerCase().trim());

      let deviceCategoryId = '';
      if (item.category) {
        if (typeof item.category === 'object' && item.category !== null) {
          deviceCategoryId = item.category._id || item.category.toString();
        } else {
          deviceCategoryId = String(item.category);
        }
      }

      // Chuẩn hóa ID để so sánh
      const normDevCatId = deviceCategoryId ? String(deviceCategoryId) : '';
      const normSelCatKey = selectedCategoryKey ? String(selectedCategoryKey) : '';

      const categoryMatches = selectedCategoryKey === 'all' || normDevCatId === normSelCatKey;

      return nameMatches && categoryMatches;
    });

    // Sort Logic
    return list.sort((a, b) => {
      if (sort === 'newest') return new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id);
      return new Date(a.createdAt || a._id) - new Date(b.createdAt || b._id);
    });
  }, [devices, inventories, search, sort, selectedCategoryKey]);

  // --- ACTIONS ---
  const handleEdit = (record) => {
    setEditingId(record._id);
    // Fill data vào form Antd
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      image: record.image,
      category_id: record.category?._id || record.category,
      total: record.total,
      available: record.available,
      broken: record.broken,
      location: record.location
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    setLoading(true); // Show loading trên table
    try {
      const res = await fetch(`${API_BASE}/devices/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const msg = (await res.json().catch(() => ({}))).message || 'Không xóa được thiết bị';
        throw new Error(msg);
      }
      message.success('Đã xóa thiết bị thành công');
      await loadData();
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields(); // Validate form
      setSaving(true);

      const payload = {
        ...values,
        total: Number(values.total) || 0,
        available: values.available === '' ? undefined : Math.max(Number(values.available) || 0, 0),
        broken: Number(values.broken) || 0
      };

      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${API_BASE}/devices/${editingId}` : `${API_BASE}/devices`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const msg = (await res.json().catch(() => ({}))).message || 'Thao tác thất bại';
        throw new Error(msg);
      }

      message.success(editingId ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
      setShowAddModal(false);
      form.resetFields();
      setEditingId(null);
      await loadData();

    } catch (err) {
      if (err.errorFields) {
        // Lỗi validate form, không làm gì (Form tự hiện đỏ)
      } else {
        message.error(err.message || 'Đã có lỗi xảy ra');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleModalCancel = () => {
    setShowAddModal(false);
    form.resetFields();
    setEditingId(null);
  };

  // --- TABLE COLUMNS ---
  const columns = [
    {
      title: '#',
      key: 'index',
      width: 60,
      render: (_, __, index) => index + 1
    },
    {
      title: 'Tên Thiết Bị',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          {record.image && <img src={record.image} alt="dev" style={{ width: 30, height: 30, objectFit: 'cover', borderRadius: 4 }} />}
          <Text strong>{text}</Text>
        </Space>
      )
    },
    {
      title: 'Danh Mục',
      dataIndex: 'category',
      key: 'category',
      render: (cat) => {
        // Xử lý hiển thị tên danh mục
        if (typeof cat === 'object' && cat?.name) return <Tag color="blue">{cat.name}</Tag>;
        // Nếu chỉ là ID, tìm trong list categories
        const found = categories.find(c => String(c._id) === String(cat));
        return found ? <Tag color="blue">{found.name}</Tag> : <Text type="secondary">N/A</Text>;
      }
    },
    {
      title: 'Tổng',
      dataIndex: 'total',
      key: 'total',
      sorter: (a, b) => a.total - b.total,
    },
    {
      title: 'Đang Rảnh',
      dataIndex: 'available',
      key: 'available',
      render: (val) => <Text type="success" strong>{val}</Text>
    },
    {
      title: 'Đang Mượn',
      key: 'borrowing',
      render: (_, record) => {
        const borrowing = Math.max(record.total - record.available - record.broken, 0);
        return <Text type="warning" strong>{borrowing}</Text>;
      }
    },
    {
      title: 'Hỏng',
      dataIndex: 'broken',
      key: 'broken',
      render: (val) => val > 0 ? <Text type="danger" strong>{val}</Text> : val
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="Sửa">
            <Button
              type="primary"
              ghost
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa thiết bị?"
            description="Hành động này không thể hoàn tác"
            onConfirm={() => handleDelete(record._id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa">
              <Button danger icon={<DeleteOutlined />} size="small" />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 0 }}>
      {/* HEADER PAGE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0, color: '#001529' }}>📦 Kho Thiết Bị</Title>
        <Button icon={<ReloadOutlined />} onClick={loadData}>Làm mới</Button>
      </div>

      <Card bordered={false} className="shadow-sm">
        {/* TOOLBAR */}
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }} align="middle">
          <Col xs={24} md={6}>
            <Input
              placeholder="Tìm kiếm thiết bị..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} md={5}>
            <Select
              style={{ width: '100%' }}
              placeholder="Chọn loại linh kiện"
              value={selectedCategoryKey}
              onChange={setSelectedCategoryKey}
            >
              <Option value="all">Tất cả loại</Option>
              {categories.map(cat => (
                <Option key={cat._id} value={cat._id}>{cat.name}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={5}>
            <Select
              style={{ width: '100%' }}
              value={sort}
              onChange={setSort}
            >
              <Option value="newest">Mới nhất</Option>
              <Option value="oldest">Cũ nhất</Option>
            </Select>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowAddModal(true)}
            >
              Thêm Thiết Bị
            </Button>
          </Col>
        </Row>

        {/* TABLE */}
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* MODAL FORM */}
      <Modal
        title={editingId ? "Cập nhật thiết bị" : "Thêm thiết bị mới"}
        open={showAddModal}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={saving}
        okText={editingId ? "Cập nhật" : "Thêm mới"}
        cancelText="Hủy"
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            location: 'warehouse',
            total: 0,
            available: 0,
            broken: 0
          }}
        >
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="name"
                label="Tên thiết bị"
                rules={[{ required: true, message: 'Vui lòng nhập tên thiết bị' }]}
              >
                <Input placeholder="Ví dụ: Arduino Uno R3" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="category_id"
                label="Loại linh kiện"
                rules={[{ required: true, message: 'Chọn loại linh kiện' }]}
              >
                <Select placeholder="Chọn loại">
                  {categories.map(cat => (
                    <Option key={cat._id} value={cat._id}>{cat.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="image" label="Link hình ảnh">
            <Input placeholder="https://example.com/image.png" prefix={<EyeOutlined />} />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <TextArea rows={3} placeholder="Mô tả chi tiết về thiết bị..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="total" label="Tổng số lượng">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="available" label="Đang rảnh">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="broken" label="Hỏng">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="location" label="Vị trí kho">
            <Select>
              <Option value="warehouse">Kho tổng (Warehouse)</Option>
              <Option value="lab">Phòng Lab</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default SchoolDashboard;