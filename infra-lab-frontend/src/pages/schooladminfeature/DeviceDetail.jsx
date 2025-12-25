import React, { useEffect, useState, useCallback } from 'react';
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
  message,
  Spin,
  Divider,
  Table,
  DatePicker,
  Select,
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
import api from '../../services/api';
import SchoolAdminSidebar from '../../components/Sidebar/SchoolAdminSidebar';
import './DeviceDetail.css';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const PLACEHOLDER_IMG = 'https://via.placeholder.com/480x320/e5e7eb/9ca3af?text=No+image';

function DeviceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [addQuantityForm] = Form.useForm();

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [device, setDevice] = useState(null); // thông tin thiết bị
  const [instances, setInstances] = useState([]); // danh sách mã thiết bị
  const [loading, setLoading] = useState(true); 
  const [loadingInstances, setLoadingInstances] = useState(false); // loading danh sách mã thiết bị
  const [error, setError] = useState(null); 
  
  // Edit mode states
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  
  // Modal states
  const [addQuantityModalVisible, setAddQuantityModalVisible] = useState(false);
  const [addingQuantity, setAddingQuantity] = useState(false);

  // ============================================
  // API CALLS
  // ============================================
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      const devRes = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/devices/${id}?location=warehouse`,
        { headers }
      );

      if (!devRes.ok) {
        throw new Error('Không lấy được thông tin thiết bị');
      }

      const devJson = await devRes.json();
      const devData = devJson?.data || devJson;
      const categoryName = devData.category?.name || devData.category_id?.name || '';

      setDevice(devData);
      setImagePreview(devData.image || '');
      
      form.setFieldsValue({
        name: devData.name,
        description: devData.description || '',
        image: devData.image || '',
        category: categoryName,
      });
    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  }, [id, form]);

  const fetchInstances = useCallback(async () => {
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
  }, [id]); // lấy danh sách mã thiết bị

  useEffect(() => {
    if (!id) return;
    fetchData();
    fetchInstances();
  }, [id, fetchData, fetchInstances]);

  // ============================================
  // EVENT HANDLERS
  // ============================================
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

      // Tìm hoặc tạo category
      let categoryId = null;
      if (values.category) {
        const categoriesRes = await api.get('/categories');
        const categories = categoriesRes?.success ? categoriesRes.data : [];
        const existingCat = categories.find((c) => c.name === values.category);
        
        if (existingCat) {
          categoryId = existingCat._id;
        } else {
          const newCatRes = await api.post('/categories', {
            name: values.category,
            description: '',
          });
          categoryId = newCatRes?.success ? newCatRes.data?._id : null;
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
        await fetchData();
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
    if (!device) return;
    
    const categoryName = device.category?.name || device.category_id?.name || '';
    form.setFieldsValue({
      name: device.name,
      description: device.description || '',
      image: device.image || '',
      category: categoryName,
    });
    setImagePreview(device.image || '');
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
        await fetchData();
        await fetchInstances();
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

  const handleCloseModal = () => {
    setAddQuantityModalVisible(false);
    addQuantityForm.resetFields();
  };

  // ============================================
  // TABLE COLUMNS CONFIG
  // ============================================
  const tableColumns = [
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
      title: 'Vị trí lưu trữ',
      dataIndex: 'storage_position',
      key: 'storage_position',
      render: (text) => text || '-',
    },
  ];

  // ============================================
  // RENDER HELPERS
  // ============================================
  const renderImageSection = () => (
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
  );

  const renderDeviceInfo = () => {  // thông tin thiết bị
    const categoryName = device.category?.name || device.category_id?.name || 'N/A';
    
    return (
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
          <Descriptions title="Thông tin thiết bị" bordered column={{ xs: 1, sm: 1, md: 2 }}>
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
                <Text strong style={{color:"black"}} >{device.name}</Text>
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
                <Tag color="blue">{categoryName}</Tag> //css
              )}
            </Descriptions.Item>

            <Descriptions.Item label="Mô tả" span={2}> 
              {editing ? (
                <Form.Item name="description" style={{ margin: 0 }}>
                  <TextArea rows={4} placeholder="Nhập mô tả thiết bị" />
                </Form.Item>
              ) : (
                <Paragraph style={{ margin: 0 ,color:"black"}}>      
                  {device.description || 'Không có mô tả'} 
                </Paragraph>
              )}
            </Descriptions.Item>
          </Descriptions>
        </Form>
      </Card>
    );
  };

  const renderInstancesTable = () => (
    <Card
      title="Danh sách mã thiết bị (Serial Numbers)"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setAddQuantityModalVisible(true)}
        >
          Thêm số lượng
        </Button> //css
      }
      style={{ marginTop: 24, background: '#fff' }}
    >
      <Table
        dataSource={instances}
        loading={loadingInstances}
        rowKey="_id"
        columns={tableColumns}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} thiết bị`,
        }}
      />
    </Card>
  );

  const renderAddQuantityModal = () => (   // modal thêm số lượng thiết bị
    <Modal
      title="Thêm số lượng thiết bị"
      open={addQuantityModalVisible}
      onCancel={handleCloseModal}
      destroyOnClose
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
                <Option value="warehouse">Kho tổng (Warehouse)</Option>
                <Option value="lab">Phòng Lab</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Vị trí lưu trữ" name="storage_position">
          <Input placeholder="VD: Tủ A - Ngăn 2 - Ô 5" />
        </Form.Item>

        <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
          <Space>
            <Button onClick={handleCloseModal} disabled={addingQuantity}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={addingQuantity}>
              Thêm số lượng
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );

  // ============================================
  // LOADING & ERROR STATES
  // ============================================
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

  // ============================================
  // MAIN RENDER
  // ============================================
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
                  <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
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

          {/* Main Content */}
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              {renderImageSection()}
            </Col>
            <Col xs={24} md={16}>
              {renderDeviceInfo()}
              {renderInstancesTable()}
            </Col>
          </Row>

          {/* Modals */}
          {renderAddQuantityModal()}
        </Content>
      </Layout>
    </Layout>
  );
}

export default DeviceDetail;
