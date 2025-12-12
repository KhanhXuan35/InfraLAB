import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Spin, 
  Form, 
  Input, 
  DatePicker, 
  Button, 
  Typography, 
  Space, 
  Alert, 
  message,
  Descriptions,
  Tag,
  Image,
  Divider
} from 'antd';
import { 
  ArrowLeftOutlined,
  ShoppingOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Container, FormCard } from './style';
import { STUDENT_ROUTES } from '../../../constants/routes';
import api from '../../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

const RegisterBorrowMultiple = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSelectedItems();
  }, []);

  const loadSelectedItems = async () => {
    try {
      const selectedItemsStr = sessionStorage.getItem('selectedBorrowItems');
      if (!selectedItemsStr) {
        setError('Không tìm thấy sản phẩm đã chọn');
        setLoading(false);
        return;
      }

      const selectedItems = JSON.parse(selectedItemsStr);
      if (!selectedItems || selectedItems.length === 0) {
        setError('Không có sản phẩm nào được chọn');
        setLoading(false);
        return;
      }

      // Fetch device details for all selected items
      const devicePromises = selectedItems.map(async (item) => {
        try {
          const response = await fetch(`http://localhost:5000/api/devices/${item.deviceId}?location=lab`);
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              return {
                device: data.data,
                quantity: item.quantity
              };
            }
          }
          return null;
        } catch (error) {
          console.error(`Error fetching device ${item.deviceId}:`, error);
          return null;
        }
      });

      const fetchedDevices = await Promise.all(devicePromises);
      const validDevices = fetchedDevices.filter(d => d !== null);
      
      if (validDevices.length === 0) {
        setError('Không thể tải thông tin thiết bị');
      } else {
        setDevices(validDevices);
        // Set default return date (7 days from now)
        form.setFieldsValue({
          return_due_date: dayjs().add(7, 'day')
        });
      }
    } catch (error) {
      console.error('Error loading selected items:', error);
      setError('Có lỗi xảy ra khi tải thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const borrowData = {
        items: devices.map(item => ({
          device_id: item.device._id,
          quantity: item.quantity
        })),
        return_due_date: values.return_due_date.format('YYYY-MM-DD'),
        purpose: values.purpose || '',
        notes: values.notes || ''
      };

      const res = await api.post('/borrow', borrowData);

      if (res.success) {
        sessionStorage.removeItem('selectedBorrowItems');
        message.success(`Đăng ký mượn ${devices.length} thiết bị thành công!`);
        navigate(STUDENT_ROUTES.CART);
      } else {
        message.error(res.message || 'Đăng ký mượn thất bại');
      }
    } catch (error) {
      console.error('Error submitting borrow request:', error);
      message.error(error.message || 'Có lỗi xảy ra khi đăng ký mượn thiết bị');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Đang tải thông tin...</Text>
          </div>
        </div>
      </Container>
    );
  }

  if (error || devices.length === 0) {
    return (
      <Container>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(STUDENT_ROUTES.CART)}
          style={{ marginBottom: 16 }}
        >
          Quay lại
        </Button>
        <Alert
          message="Lỗi"
          description={error || 'Không tìm thấy thiết bị'}
          type="error"
          showIcon
        />
      </Container>
    );
  }

  return (
    <Container>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate(STUDENT_ROUTES.CART)}
        style={{ marginBottom: 16 }}
      >
        Quay lại
      </Button>

      <Title level={2}>Đăng ký mượn thiết bị</Title>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Devices Info Card */}
        <Card title={`Danh sách thiết bị (${devices.length} sản phẩm)`}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {devices.map((item, index) => (
              <Card key={item.device._id} size="small" style={{ backgroundColor: '#fafafa' }}>
                <Space size="large" style={{ width: '100%' }} align="start">
                  {item.device.image ? (
                    <Image
                      alt={item.device.name}
                      src={item.device.image}
                      width={100}
                      height={100}
                      style={{ objectFit: 'cover', borderRadius: '8px' }}
                      fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4="
                    />
                  ) : (
                    <div style={{ 
                      width: 100,
                      height: 100,
                      backgroundColor: '#f5f5f5', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      borderRadius: '8px'
                    }}>
                      <ShoppingOutlined style={{ fontSize: 32, color: '#d9d9d9' }} />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <Title level={5} style={{ margin: 0 }}>{item.device.name}</Title>
                    {item.device.category && (
                      <Tag color="blue" style={{ marginTop: 4, marginBottom: 8 }}>
                        {item.device.category.name}
                      </Tag>
                    )}
                    <Descriptions column={1} size="small" bordered>
                      <Descriptions.Item label="Số lượng mượn">
                        <Text strong>{item.quantity}</Text>
                      </Descriptions.Item>
                      {item.device.inventory && (
                        <>
                          <Descriptions.Item label="Có sẵn">
                            <Text strong style={{ color: item.device.inventory.available > 0 ? '#52c41a' : '#ff4d4f' }}>
                              {item.device.inventory.available}
                            </Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Vị trí">
                            {item.device.inventory.location === 'lab' ? 'Phòng Lab' : 'Kho'}
                          </Descriptions.Item>
                        </>
                      )}
                    </Descriptions>
                  </div>
                </Space>
              </Card>
            ))}
          </Space>
        </Card>

        {/* Borrow Form */}
        <FormCard>
          <Title level={4} style={{ marginBottom: 24 }}>Thông tin mượn</Title>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
          >
            <Divider />

            <Title level={4} style={{ marginBottom: 24 }}>Thông tin mượn thiết bị</Title>

            <Form.Item
              label="Ngày dự kiến trả"
              name="return_due_date"
              rules={[
                { required: true, message: 'Vui lòng chọn ngày dự kiến trả' },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    const selectedDate = dayjs(value);
                    const today = dayjs().startOf('day');
                    if (selectedDate.isBefore(today)) {
                      return Promise.reject(new Error('Ngày trả phải sau ngày hiện tại'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                disabledDate={(current) => current && current < dayjs().startOf('day')}
              />
            </Form.Item>

            <Form.Item
              label="Mục đích sử dụng"
              name="purpose"
              rules={[
                { required: true, message: 'Vui lòng nhập mục đích sử dụng' },
                { max: 500, message: 'Mục đích không được quá 500 ký tự' }
              ]}
            >
              <TextArea
                rows={4}
                placeholder="Ví dụ: Thực hành môn học, Dự án nghiên cứu, ..."
                showCount
                maxLength={500}
              />
            </Form.Item>

            <Form.Item
              label="Ghi chú (tùy chọn)"
              name="notes"
              rules={[
                { max: 1000, message: 'Ghi chú không được quá 1000 ký tự' }
              ]}
            >
              <TextArea
                rows={3}
                placeholder="Thêm ghi chú nếu cần..."
                showCount
                maxLength={1000}
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={submitting}
                  icon={<CheckCircleOutlined />}
                >
                  Xác nhận đăng ký mượn ({devices.length} thiết bị)
                </Button>
                <Button
                  size="large"
                  onClick={() => navigate(STUDENT_ROUTES.CART)}
                >
                  Hủy
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </FormCard>
      </Space>
    </Container>
  );
};

export default RegisterBorrowMultiple;

