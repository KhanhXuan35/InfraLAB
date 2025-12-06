import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Card, 
  Spin, 
  Form, 
  Input, 
  InputNumber,
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
import { STUDENT_ROUTES } from '../../constants/routes';

const { Title, Text } = Typography;
const { TextArea } = Input;

const RegisterBorrow = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(parseInt(searchParams.get('quantity')) || 1);

  useEffect(() => {
    fetchDeviceDetail();
  }, [id]);

  const fetchDeviceDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/devices/${id}?location=lab`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setDevice(data.data);
        // Set default return date (7 days from now)
        form.setFieldsValue({
          return_due_date: dayjs().add(7, 'day')
        });
        // Update max quantity based on available inventory
        const maxQty = data.data.inventory ? data.data.inventory.available : 0;
        if (quantity > maxQty && maxQty > 0) {
          setQuantity(maxQty);
        }
      } else {
        setError(data.message || 'Không thể tải thông tin thiết bị');
      }
    } catch (error) {
      console.error('Error fetching device detail:', error);
      setError(`Không thể tải thông tin thiết bị: ${error.message}`);
      message.error('Không thể kết nối đến server');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const borrowData = {
        device_id: device._id,
        quantity: quantity,
        return_due_date: values.return_due_date.format('YYYY-MM-DD'),
        purpose: values.purpose || '',
        notes: values.notes || ''
      };

      // TODO: Call API to create borrow request
      console.log('Borrow data:', borrowData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success('Đăng ký mượn thiết bị thành công!');
      navigate(STUDENT_ROUTES.DEVICES);
    } catch (error) {
      console.error('Error submitting borrow request:', error);
      message.error('Có lỗi xảy ra khi đăng ký mượn thiết bị');
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

  if (error || !device) {
    return (
      <Container>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
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

  const maxQuantity = device.inventory ? device.inventory.available : 0;

  return (
    <Container>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16 }}
      >
        Quay lại
      </Button>

      <Title level={2}>Đăng ký mượn thiết bị</Title>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Device Info Card */}
        <Card title="Thông tin thiết bị">
          <Space size="large" style={{ width: '100%' }}>
            {device.image ? (
              <Image
                alt={device.name}
                src={device.image}
                width={150}
                height={150}
                style={{ objectFit: 'cover', borderRadius: '8px' }}
                fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4="
              />
            ) : (
              <div style={{ 
                width: 150,
                height: 150,
                backgroundColor: '#f5f5f5', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                borderRadius: '8px'
              }}>
                <ShoppingOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <Title level={4}>{device.name}</Title>
              {device.category && (
                <Tag color="blue" style={{ marginBottom: 8 }}>
                  {device.category.name}
                </Tag>
              )}
              <Descriptions column={1} size="small" style={{ marginTop: 8 }}>
                <Descriptions.Item label="Số lượng mượn">
                  <Space>
                    <InputNumber
                      min={1}
                      max={device.inventory ? device.inventory.available : 1}
                      value={quantity}
                      onChange={(value) => setQuantity(value || 1)}
                      disabled={!device.inventory || device.inventory.available === 0}
                      style={{ width: '120px' }}
                    />
                    {device.inventory && device.inventory.available > 0 && (
                      <Text type="secondary">
                        (Tối đa: {device.inventory.available})
                      </Text>
                    )}
                  </Space>
                </Descriptions.Item>
                {device.inventory && (
                  <>
                    <Descriptions.Item label="Có sẵn">
                      <Text strong style={{ color: device.inventory.available > 0 ? '#52c41a' : '#ff4d4f' }}>
                        {device.inventory.available}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Vị trí">
                      {device.inventory.location === 'lab' ? 'Phòng Lab' : 'Kho'}
                    </Descriptions.Item>
                  </>
                )}
              </Descriptions>
            </div>
          </Space>
        </Card>

        {/* Borrow Form */}
        <FormCard>
          <Title level={4} style={{ marginBottom: 24 }}>Thông tin cá nhân</Title>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
          >
            <Form.Item
              label="Họ và tên"
              name="full_name"
              rules={[
                { required: true, message: 'Vui lòng nhập họ và tên' },
                { max: 100, message: 'Họ và tên không được quá 100 ký tự' }
              ]}
            >
              <Input placeholder="Nhập họ và tên đầy đủ" />
            </Form.Item>

            <Form.Item
              label="Mã sinh viên"
              name="student_code"
              rules={[
                { required: true, message: 'Vui lòng nhập mã sinh viên' },
                { pattern: /^[A-Z0-9]+$/, message: 'Mã sinh viên chỉ chứa chữ in hoa và số' }
              ]}
            >
              <Input 
                placeholder="VD: SV001, B20DCCN001"
                onKeyPress={(e) => {
                  const char = String.fromCharCode(e.which);
                  if (!/[A-Z0-9]/.test(char) && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                  }
                }}
                style={{ textTransform: 'uppercase' }}
                onInput={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                }}
              />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email' },
                { type: 'email', message: 'Email không hợp lệ' }
              ]}
            >
              <Input placeholder="example@email.com" />
            </Form.Item>

            <Form.Item
              label="Số điện thoại"
              name="phone"
              rules={[
                { required: true, message: 'Vui lòng nhập số điện thoại' },
                { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại phải có 10-11 chữ số' }
              ]}
            >
              <Input 
                placeholder="0123456789"
                type="tel"
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key) && !e.ctrlKey && !e.metaKey && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Tab') {
                    e.preventDefault();
                  }
                }}
                onPaste={(e) => {
                  const paste = (e.clipboardData || window.clipboardData).getData('text');
                  if (!/^[0-9]+$/.test(paste)) {
                    e.preventDefault();
                  }
                }}
              />
            </Form.Item>

            <Form.Item
              label="Lớp"
              name="class"
              rules={[
                { required: true, message: 'Vui lòng nhập lớp' },
                { max: 50, message: 'Lớp không được quá 50 ký tự' }
              ]}
            >
              <Input placeholder="VD: D20CQCN01-B" />
            </Form.Item>

            <Form.Item
              label="Khoa"
              name="faculty"
              rules={[
                { required: true, message: 'Vui lòng nhập khoa' },
                { max: 100, message: 'Khoa không được quá 100 ký tự' }
              ]}
            >
              <Input placeholder="VD: Công nghệ thông tin" />
            </Form.Item>

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
                  Xác nhận đăng ký mượn
                </Button>
                <Button
                  size="large"
                  onClick={() => navigate(-1)}
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

export default RegisterBorrow;

