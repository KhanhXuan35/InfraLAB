import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Layout,
  Card,
  Typography,
  Button,
  Row,
  Col,
  Descriptions,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Upload,
  message,
  Spin,
  Divider,
  Table,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  UploadOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { DatePicker, Select } from 'antd';
import api from '../services/api';
import SchoolAdminSidebar from '../components/SchoolAdmin/SchoolAdminSidebar';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const PLACEHOLDER_IMG = 'https://via.placeholder.com/480x320/e5e7eb/9ca3af?text=No+image';

function ViewDetailDevice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [device, setDevice] = useState(null);
  const [inventories, setInventories] = useState([]);
  const [instances, setInstances] = useState([]);
  const [loadingInstances, setLoadingInstances] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [addQuantityModalVisible, setAddQuantityModalVisible] = useState(false);
  const [addQuantityForm] = Form.useForm();
  const [addingQuantity, setAddingQuantity] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchData();
    fetchInstances();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [devRes, invRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/devices/${id}?location=warehouse`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/inventories`, { headers }),
      ]);

      if (!devRes.ok) {
        throw new Error('Không lấy được thông tin thiết bị');
      }

      const devJson = await devRes.json();
      const invJson = invRes.ok ? await invRes.json() : [];

      const devData = devJson?.data || devJson;
      const invList = Array.isArray(invJson) ? invJson : invJson?.data || [];

      setDevice(devData);
      setInventories(invList);
      
      // Set form values
      form.setFieldsValue({
        name: devData.name,
        description: devData.description || '',
        image: devData.image || '',
        category: devData.category?.name || devData.category_id?.name || '',
      });

      if (devData.image) {
        setImagePreview(devData.image);
      }
    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  const fetchInstances = async () => {
    if (!id) return;
    setLoadingInstances(true);
    try {
      const res = await api.get(`/school-admin/devices/${id}/instances?limit=1000`);
      if (res.success && res.data) {
        setInstances(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error('Fetch instances error:', err);
    } finally {
      setLoadingInstances(false);
    }
  };

  const inventoryInfo = React.useMemo(() => {
    if (!device || !inventories.length) {
      return { total: 0, available: 0, broken: 0, borrowing: 0 };
    }
    const devId = device._id || device.id || '';
    const inv = inventories.find((i) => {
      const iDev = i.device_id?._id || i.device_id || '';
      return String(iDev) === String(devId);
    });
    const total = inv?.total ?? 0;
    const available = inv?.available ?? 0;
    const broken = inv?.broken ?? 0;
    const borrowing = Math.max(total - available - broken, 0);
    return { total, available, broken, borrowing, inventory: inv };
  }, [device, inventories]);

  const handleUploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const localUrl = URL.createObjectURL(file);
      setImagePreview(localUrl);

      const formData = new FormData();
      formData.append('image', file);

      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.success && res.imageUrl) {
        form.setFieldsValue({ image: res.imageUrl });
        setImagePreview(res.imageUrl);
        message.success('Upload ảnh thành công');
      } else {
        message.error(res.message || 'Upload ảnh thất bại');
      }
    } catch (error) {
      console.error('Upload image error:', error);
      message.error(error.message || 'Có lỗi khi upload ảnh');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (values) => {
    try {
      setSaving(true);

      // Tìm category_id từ tên category
      let categoryId = null;
      if (values.category) {
        const categoriesRes = await api.get('/categories');
        if (categoriesRes.success && categoriesRes.data) {
          const cat = categoriesRes.data.find((c) => c.name === values.category);
          if (cat) {
            categoryId = cat._id;
          } else {
            // Tạo category mới nếu chưa có
            const newCatRes = await api.post('/categories', {
              name: values.category,
              description: '',
            });
            if (newCatRes.success && newCatRes.data) {
              categoryId = newCatRes.data._id;
            }
          }
        }
      }

      const payload = {
        name: values.name.trim(),
        description: values.description?.trim() || '',
        image: values.image?.trim() || '',
        category_id: categoryId,
        location: 'warehouse',
      };

      const res = await api.put(`/devices/${id}`, payload);

      if (res.success) {
        message.success('Cập nhật thiết bị thành công');
        setEditing(false);
        await fetchData(); // Reload data
      } else {
        message.error(res.message || 'Không thể cập nhật thiết bị');
      }
    } catch (error) {
      console.error('Update device error:', error);
      message.error(error.message || 'Có lỗi xảy ra khi cập nhật thiết bị');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    // Reset form về giá trị ban đầu
    if (device) {
      form.setFieldsValue({
        name: device.name,
        description: device.description || '',
        image: device.image || '',
        category: device.category?.name || device.category_id?.name || '',
      });
      setImagePreview(device.image || '');
    }
  };

  const handleAddQuantity = async (values) => {
    try {
      setAddingQuantity(true);
      const payload = {
        quantity: values.quantity,
        purchase_date: values.purchase_date.format('YYYY-MM-DD'),
        supplier: values.supplier?.trim() || '',
        invoice_number: values.invoice_number?.trim() || '',
        warranty_months: values.warranty_months || 12,
        initial_location: values.initial_location || 'warehouse',
        storage_position: values.storage_position?.trim() || '',
      };

      const res = await api.post(`/school-admin/devices/${id}/add-instances`, payload);

      if (res.success) {
        message.success(res.message || `Đã thêm ${values.quantity} chiếc vào thiết bị`);
        setAddQuantityModalVisible(false);
        addQuantityForm.resetFields();
        await fetchData(); // Reload data
        await fetchInstances(); // Reload instances list
      } else {
        message.error(res.message || 'Không thể thêm số lượng');
      }
    } catch (error) {
      console.error('Add quantity error:', error);
      message.error(error.message || 'Có lỗi xảy ra khi thêm số lượng');
    } finally {
      setAddingQuantity(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', background: '#fff', minHeight: '100vh' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">Đang tải dữ liệu...</Text>
        </div>
      </div>
    );
  }

  if (error || !device) {
    return (
      <div style={{ padding: '48px', background: '#fff', minHeight: '100vh' }}>
        <Card>
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Text type="danger" style={{ fontSize: 16 }}>
              {error || 'Không tìm thấy thiết bị'}
            </Text>
            <div style={{ marginTop: 24 }}>
              <Button onClick={() => navigate(-1)}>Quay lại</Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const categoryName =
    device.category?.name || device.category_id?.name || 'N/A';

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <SchoolAdminSidebar />
      <Layout style={{ marginLeft: 260 }}>
        <Content style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <Card style={{ marginBottom: 24, background: '#fff' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate(-1)}
                >
                  Quay lại
                </Button>
                <Divider type="vertical" />
                <Title level={3} style={{ margin: 0 }}>
                  Chi tiết thiết bị
                </Title>
              </Space>
            </Col>
            <Col>
              {!editing ? (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => setEditing(true)}
                >
                  Chỉnh sửa
                </Button>
              ) : (
                <Space>
                  <Button onClick={handleCancel} disabled={saving}>
                    <CloseOutlined /> Hủy
                  </Button>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={saving}
                    onClick={() => form.submit()}
                  >
                    Lưu thay đổi
                  </Button>
                </Space>
              )}
            </Col>
          </Row>
        </Card>

        <Row gutter={[24, 24]}>
          {/* Left: Image */}
          <Col xs={24} md={8}>
            <Card style={{ background: '#fff' }}>
              <div style={{ textAlign: 'center' }}>
                {editing ? (
                  <div>
                    <img
                      src={imagePreview || PLACEHOLDER_IMG}
                      alt={device.name}
                      style={{
                        width: '100%',
                        maxHeight: 300,
                        objectFit: 'cover',
                        borderRadius: 8,
                        marginBottom: 16,
                        border: '1px solid #e5e7eb',
                      }}
                    />
                    <input
                      id="device-image-input"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleUploadImage}
                    />
                    <Button
                      icon={<UploadOutlined />}
                      loading={uploadingImage}
                      onClick={() => document.getElementById('device-image-input')?.click()}
                      block
                    >
                      Chọn ảnh mới
                    </Button>
                    <Form.Item name="image" noStyle>
                      <Input type="hidden" />
                    </Form.Item>
                  </div>
                ) : (
                  <img
                    src={device.image || PLACEHOLDER_IMG}
                    alt={device.name}
                    style={{
                      width: '100%',
                      maxHeight: 400,
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                    }}
                  />
                )}
              </div>
            </Card>
          </Col>

          {/* Right: Details */}
          <Col xs={24} md={16}>
            <Card style={{ background: '#fff' }}>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
                initialValues={{
                  name: device.name,
                  description: device.description || '',
                  image: device.image || '',
                  category: categoryName,
                }}
              >
                <Descriptions
                  title="Thông tin thiết bị"
                  bordered
                  column={{ xs: 1, sm: 1, md: 2 }}
                >
                  <Descriptions.Item label="Tên thiết bị" span={2}>
                    {editing ? (
                      <Form.Item
                        name="name"
                        rules={[{ required: true, message: 'Vui lòng nhập tên thiết bị' }]}
                        style={{ margin: 0 }}
                      >
                        <Input placeholder="Nhập tên thiết bị" />
                      </Form.Item>
                    ) : (
                      <Text strong>{device.name}</Text>
                    )}
                  </Descriptions.Item>

                  <Descriptions.Item label="Danh mục" span={2}>
                    {editing ? (
                      <Form.Item
                        name="category"
                        rules={[{ required: true, message: 'Vui lòng nhập danh mục' }]}
                        style={{ margin: 0 }}
                      >
                        <Input placeholder="Nhập tên danh mục" />
                      </Form.Item>
                    ) : (
                      <Tag color="blue">{categoryName}</Tag>
                    )}
                  </Descriptions.Item>

                  <Descriptions.Item label="Mô tả" span={2}>
                    {editing ? (
                      <Form.Item name="description" style={{ margin: 0 }}>
                        <TextArea
                          rows={4}
                          placeholder="Nhập mô tả thiết bị"
                        />
                      </Form.Item>
                    ) : (
                      <Paragraph style={{ margin: 0 }}>
                        {device.description || 'Không có mô tả'}
                      </Paragraph>
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </Form>
            </Card>

            {/* Inventory Stats */}
            <Card
              title="Thống kê tồn kho"
              extra={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setAddQuantityModalVisible(true)}
                >
                  Thêm số lượng
                </Button>
              }
              style={{ marginTop: 24, background: '#fff' }}
            >
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={6}>
                  <div style={{ textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: 8 }}>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                      Tổng số lượng
                    </Text>
                    <Text strong style={{ fontSize: 24, display: 'block', marginTop: 8 }}>
                      {inventoryInfo.total}
                    </Text>
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div style={{ textAlign: 'center', padding: '16px', background: '#f0fdf4', borderRadius: 8 }}>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                      Đang rảnh
                    </Text>
                    <Text strong style={{ fontSize: 24, color: '#16a34a', display: 'block', marginTop: 8 }}>
                      {inventoryInfo.available}
                    </Text>
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div style={{ textAlign: 'center', padding: '16px', background: '#fffbeb', borderRadius: 8 }}>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                      Đang mượn
                    </Text>
                    <Text strong style={{ fontSize: 24, color: '#d97706', display: 'block', marginTop: 8 }}>
                      {inventoryInfo.borrowing}
                    </Text>
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div style={{ textAlign: 'center', padding: '16px', background: '#fef2f2', borderRadius: 8 }}>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                      Hỏng
                    </Text>
                    <Text strong style={{ fontSize: 24, color: '#dc2626', display: 'block', marginTop: 8 }}>
                      {inventoryInfo.broken}
                    </Text>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Danh sách Instances */}
            <Card
              title="Danh sách mã thiết bị (Serial Numbers)"
              style={{ marginTop: 24, background: '#fff' }}
            >
              <Table
                dataSource={instances}
                loading={loadingInstances}
                rowKey="_id"
                pagination={{
                  pageSize: 20,
                  showSizeChanger: true,
                  showTotal: (total) => `Tổng ${total} thiết bị`,
                }}
                columns={[
                  {
                    title: 'STT',
                    key: 'index',
                    width: 60,
                    render: (_, __, index) => index + 1,
                  },
                  {
                    title: 'Mã Serial Number',
                    dataIndex: 'serial_number',
                    key: 'serial_number',
                    render: (text) => (
                      <Text strong style={{ fontFamily: 'monospace', fontSize: 14, color: '#1890ff' }}>
                        {text}
                      </Text>
                    ),
                    sorter: (a, b) => a.serial_number.localeCompare(b.serial_number),
                  },
                  {
                    title: 'Tình trạng',
                    dataIndex: 'condition',
                    key: 'condition',
                    render: (condition) => {
                      const colors = {
                        new: 'green',
                        good: 'blue',
                        fair: 'orange',
                        poor: 'red',
                      };
                      const labels = {
                        new: 'Mới',
                        good: 'Tốt',
                        fair: 'Khá',
                        poor: 'Kém',
                      };
                      return <Tag color={colors[condition]}>{labels[condition] || condition}</Tag>;
                    },
                  },
                  {
                    title: 'Trạng thái',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status) => {
                      const colors = {
                        available: 'success',
                        borrowed: 'warning',
                        repairing: 'processing',
                        broken: 'error',
                        retired: 'default',
                        maintenance: 'default',
                      };
                      const labels = {
                        available: 'Có sẵn',
                        borrowed: 'Đang mượn',
                        repairing: 'Đang sửa',
                        broken: 'Hỏng',
                        retired: 'Nghỉ hưu',
                        maintenance: 'Bảo trì',
                      };
                      return <Tag color={colors[status]}>{labels[status] || status}</Tag>;
                    },
                  },
                  {
                    title: 'Vị trí',
                    dataIndex: 'location',
                    key: 'location',
                    render: (location) => {
                      const labels = {
                        warehouse: 'Kho tổng',
                        lab: 'Phòng Lab',
                        borrowed: 'Đang mượn',
                        repair_shop: 'Cửa hàng sửa',
                      };
                      return labels[location] || location;
                    },
                  },
                  {
                    title: 'Vị trí lưu trữ',
                    dataIndex: 'storage_position',
                    key: 'storage_position',
                    render: (text) => text || '-',
                  },
                  {
                    title: 'Ngày mua',
                    dataIndex: 'purchase_date',
                    key: 'purchase_date',
                    render: (date) => (date ? dayjs(date).format('DD/MM/YYYY') : '-'),
                  },
                  {
                    title: 'Bảo hành đến',
                    dataIndex: 'warranty_until',
                    key: 'warranty_until',
                    render: (date) => {
                      if (!date) return '-';
                      const warrantyDate = dayjs(date);
                      const isExpired = warrantyDate.isBefore(dayjs());
                      const daysLeft = warrantyDate.diff(dayjs(), 'day');
                      return (
                        <span style={{ color: isExpired ? '#dc2626' : daysLeft < 90 ? '#d97706' : '#16a34a' }}>
                          {warrantyDate.format('DD/MM/YYYY')}
                          {!isExpired && daysLeft < 90 && (
                            <Tag color="warning" style={{ marginLeft: 8 }}>
                              Còn {daysLeft} ngày
                            </Tag>
                          )}
                        </span>
                      );
                    },
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>

        {/* Modal thêm số lượng */}
        <Modal
          title="Thêm số lượng thiết bị"
          open={addQuantityModalVisible}
          onCancel={() => {
            setAddQuantityModalVisible(false);
            addQuantityForm.resetFields();
          }}
          footer={null}
          width={600}
        >
          <Form
            form={addQuantityForm}
            layout="vertical"
            onFinish={handleAddQuantity}
            initialValues={{
              quantity: 1,
              warranty_months: 12,
              initial_location: 'warehouse',
              purchase_date: dayjs(),
            }}
          >
            <Form.Item
              label="Số lượng cần thêm"
              name="quantity"
              rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
            >
              <InputNumber min={1} max={1000} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="Ngày mua"
              name="purchase_date"
              rules={[{ required: true, message: 'Vui lòng chọn ngày mua' }]}
            >
              <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Nhà cung cấp" name="supplier">
                  <Input placeholder="VD: Công ty ABC" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Số hóa đơn" name="invoice_number">
                  <Input placeholder="VD: HD-2024-001" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Thời gian bảo hành (tháng)" name="warranty_months">
                  <InputNumber min={0} max={60} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Vị trí ban đầu"
                  name="initial_location"
                  rules={[{ required: true, message: 'Vui lòng chọn vị trí' }]}
                >
                  <Select>
                    <Select.Option value="warehouse">Kho tổng (Warehouse)</Select.Option>
                    <Select.Option value="lab">Phòng Lab</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Vị trí lưu trữ" name="storage_position">
              <Input placeholder="VD: Tủ A - Ngăn 2 - Ô 5" />
            </Form.Item>

            <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
              <Space>
                <Button
                  onClick={() => {
                    setAddQuantityModalVisible(false);
                    addQuantityForm.resetFields();
                  }}
                >
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" loading={addingQuantity}>
                  Thêm số lượng
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
        </Content>
      </Layout>
    </Layout>
  );
}

export default ViewDetailDevice;
