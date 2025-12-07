import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Spin, 
  Image, 
  Typography, 
  Tag, 
  Space, 
  Button, 
  Descriptions, 
  Alert,
  message,
  InputNumber
} from 'antd';
import { 
  ArrowLeftOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { Container, DetailCard, ImageContainer, ActionSection } from './style';
import { STUDENT_ROUTES } from '../../../constants/routes';
import { useCart } from '../../../contexts/CartContext';

const { Title, Text, Paragraph } = Typography;

const DeviceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);

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
      console.log('Device detail response:', data);
      
      if (data.success) {
        setDevice(data.data);
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


  const getAvailabilityStatus = (inventory) => {
    if (!inventory) {
      return { status: 'no-data', text: 'Chưa có thông tin', color: 'default' };
    }
    if (inventory.available > 0) {
      return { status: 'available', text: 'Có sẵn', color: 'success' };
    }
    return { status: 'unavailable', text: 'Hết hàng', color: 'error' };
  };

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Đang tải thông tin thiết bị...</Text>
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
          onClick={() => navigate(STUDENT_ROUTES.DEVICES)}
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

  const availability = getAvailabilityStatus(device.inventory);
  const maxQuantity = device.inventory ? device.inventory.available : 0;

  return (
    <Container>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate(STUDENT_ROUTES.DEVICES)}
        style={{ marginBottom: 16 }}
      >
        Quay lại danh sách
      </Button>

      <DetailCard>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <ImageContainer>
              {device.image ? (
                <Image
                  alt={device.name}
                  src={device.image}
                  width="100%"
                  style={{ maxWidth: '500px', borderRadius: '8px' }}
                  fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4="
                />
              ) : (
                <div style={{ 
                  width: '100%',
                  maxWidth: '500px',
                  height: '400px', 
                  backgroundColor: '#f5f5f5', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  borderRadius: '8px'
                }}>
                  <ShoppingOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
                </div>
              )}
            </ImageContainer>

            <div style={{ flex: 1, minWidth: '300px' }}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Title level={2}>{device.name}</Title>
                  {device.category && (
                    <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
                      {device.category.name}
                    </Tag>
                  )}
                </div>

                <Space>
                  <Tag 
                    color={availability.color} 
                    icon={availability.status === 'available' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                    style={{ fontSize: '14px', padding: '4px 12px' }}
                  >
                    {availability.text}
                  </Tag>
                </Space>

                {device.inventory && (
                  <Descriptions column={1} bordered size="small">
                    <Descriptions.Item label="Tổng số lượng">
                      {device.inventory.total}
                    </Descriptions.Item>
                    <Descriptions.Item label="Có sẵn">
                      <Text strong style={{ color: device.inventory.available > 0 ? '#52c41a' : '#ff4d4f' }}>
                        {device.inventory.available}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Đang hỏng">
                      {device.inventory.broken}
                    </Descriptions.Item>
                    <Descriptions.Item label="Vị trí">
                      {device.inventory.location === 'lab' ? 'Phòng Lab' : 'Kho'}
                    </Descriptions.Item>
                  </Descriptions>
                )}

                <ActionSection>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <div>
                      <Text strong>Số lượng mượn: </Text>
                      <InputNumber
                        min={1}
                        max={maxQuantity}
                        value={quantity}
                        onChange={setQuantity}
                        disabled={maxQuantity === 0}
                        style={{ width: '120px', marginLeft: '8px' }}
                      />
                      {maxQuantity > 0 && (
                        <Text type="secondary" style={{ marginLeft: '8px' }}>
                          (Tối đa: {maxQuantity})
                        </Text>
                      )}
                    </div>
                    <Button
                      type="primary"
                      size="large"
                      block
                      onClick={() => {
                        addToCart(device, quantity);
                        message.success(`Đã thêm ${quantity} ${device.name} vào giỏ hàng`);
                      }}
                      disabled={maxQuantity === 0}
                      style={{ height: '48px', fontSize: '16px' }}
                    >
                      Đăng ký mượn sản phẩm
                    </Button>
                    {maxQuantity === 0 && (
                      <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
                        Thiết bị hiện không có sẵn
                      </Text>
                    )}
                  </Space>
                </ActionSection>
              </Space>
            </div>
          </div>

          {device.description && (
            <Card title="Mô tả" style={{ marginTop: '24px' }}>
              <Paragraph>{device.description}</Paragraph>
            </Card>
          )}
        </Space>
      </DetailCard>
    </Container>
  );
};

export default DeviceDetail;

