import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Typography, 
  Space, 
  Button, 
  Descriptions, 
  Tag, 
  Image,
  Empty,
  InputNumber,
  message,
  Spin,
  Checkbox
} from 'antd';
import { 
  ShoppingOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { Container, FooterBar, FooterContent, FooterLeft, FooterRight } from './style';
import { useCart } from '../../../contexts/CartContext';
import { STUDENT_ROUTES } from '../../../constants/routes';

const { Title, Text } = Typography;

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());

  useEffect(() => {
    fetchDeviceDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems]);

  const fetchDeviceDetails = async () => {
    if (cartItems.length === 0) {
      setDevices([]);
      return;
    }

    setLoading(true);
    try {
      // Fetch latest device details for all items in cart
      const devicePromises = cartItems.map(async (item) => {
        try {
          const response = await fetch(`http://localhost:5000/api/devices/${item.device._id}?location=lab`);
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              // Preserve the quantity from cartItems
              const currentCartItem = cartItems.find(ci => ci.device._id === item.device._id);
              return { 
                device: data.data, 
                quantity: currentCartItem ? currentCartItem.quantity : item.quantity 
              };
            }
          }
          return item; // Return original if fetch fails
        } catch (error) {
          console.error(`Error fetching device ${item.device._id}:`, error);
          return item; // Return original if fetch fails
        }
      });

      const updatedItems = await Promise.all(devicePromises);
      setDevices(updatedItems);
    } catch (error) {
      console.error('Error fetching device details:', error);
      message.error('Không thể tải thông tin thiết bị');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (deviceId, newQuantity) => {
    if (newQuantity && newQuantity > 0) {
      updateQuantity(deviceId, newQuantity);
    }
  };

  const handleRemove = (deviceId) => {
    removeFromCart(deviceId);
    message.success('Đã xóa sản phẩm khỏi giỏ hàng');
  };


  const handleSelectItem = (deviceId, checked) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(deviceId);
    } else {
      newSelected.delete(deviceId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const allAvailableIds = devices
        .filter(item => {
          const maxQuantity = item.device.inventory ? item.device.inventory.available : 0;
          return maxQuantity > 0;
        })
        .map(item => item.device._id);
      setSelectedItems(new Set(allAvailableIds));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleRemoveSelected = () => {
    if (selectedItems.size === 0) {
      message.warning('Vui lòng chọn ít nhất một sản phẩm để xóa');
      return;
    }
    const count = selectedItems.size;
    selectedItems.forEach(deviceId => {
      removeFromCart(deviceId);
    });
    setSelectedItems(new Set());
    message.success(`Đã xóa ${count} sản phẩm khỏi giỏ hàng`);
  };

  const handleRegisterBorrowSelected = () => {
    if (selectedItems.size === 0) {
      message.warning('Vui lòng chọn ít nhất một sản phẩm để đăng ký mượn');
      return;
    }

    // Get all selected items with their quantities
    const selectedItemsData = devices
      .filter(item => selectedItems.has(item.device._id))
      .map(item => {
        const cartItem = cartItems.find(ci => ci.device._id === item.device._id);
        return {
          deviceId: item.device._id,
          quantity: cartItem ? cartItem.quantity : item.quantity
        };
      });

    // Store selected items in sessionStorage and navigate
    sessionStorage.setItem('selectedBorrowItems', JSON.stringify(selectedItemsData));
    navigate(STUDENT_ROUTES.BORROW_MULTIPLE);
  };

  // Calculate selected items summary
  const selectedItemsData = devices.filter(item => selectedItems.has(item.device._id));
  const totalSelectedProducts = selectedItemsData.length;
  const totalSelectedQuantity = selectedItemsData.reduce((sum, item) => {
    const cartItem = cartItems.find(ci => ci.device._id === item.device._id);
    return sum + (cartItem ? cartItem.quantity : item.quantity);
  }, 0);

  // Check if all available items are selected
  const availableItems = devices.filter(item => {
    const maxQuantity = item.device.inventory ? item.device.inventory.available : 0;
    return maxQuantity > 0;
  });
  const isAllSelected = availableItems.length > 0 && 
    availableItems.every(item => selectedItems.has(item.device._id));
  const isIndeterminate = selectedItems.size > 0 && selectedItems.size < availableItems.length;

  const getAvailabilityStatus = (inventory) => {
    if (!inventory) {
      return { status: 'no-data', text: 'Chưa có thông tin', color: 'default' };
    }
    if (inventory.available > 0) {
      return { status: 'available', text: 'Có sẵn', color: 'success' };
    }
    return { status: 'unavailable', text: 'Hết hàng', color: 'error' };
  };

  if (loading && devices.length === 0) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Đang tải giỏ hàng...</Text>
          </div>
        </div>
      </Container>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Container>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(STUDENT_ROUTES.DEVICES)}
          style={{ marginBottom: 16 }}
        >
          Quay lại danh sách
        </Button>
        <Card>
          <Empty
            description="Giỏ hàng của bạn đang trống"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => navigate(STUDENT_ROUTES.DEVICES)}>
              Xem danh sách thiết bị
            </Button>
          </Empty>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate(STUDENT_ROUTES.DEVICES)}
        style={{ marginBottom: 16 }}
      >
        Quay lại danh sách
      </Button>

      <Title level={2}>Giỏ hàng của bạn</Title>

      <Space direction="vertical" size="large" style={{ width: '100%', marginBottom: '100px' }}>
        {devices.map((item) => {
          // Get current quantity from cartItems (source of truth)
          const cartItem = cartItems.find(ci => ci.device._id === item.device._id);
          const currentQuantity = cartItem ? cartItem.quantity : item.quantity;
          
          const availability = getAvailabilityStatus(item.device.inventory);
          const maxQuantity = item.device.inventory ? item.device.inventory.available : 0;
          const isAvailable = maxQuantity > 0;
          const isSelected = selectedItems.has(item.device._id);

          return (
            <Card key={item.device._id} style={{ width: '100%' }}>
              <Space size="large" style={{ width: '100%' }} align="start">
                <Checkbox
                  checked={isSelected}
                  onChange={(e) => handleSelectItem(item.device._id, e.target.checked)}
                  disabled={!isAvailable}
                />
                {item.device.image ? (
                  <Image
                    alt={item.device.name}
                    src={item.device.image}
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
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div>
                      <Title level={4} style={{ margin: 0 }}>{item.device.name}</Title>
                      {item.device.category && (
                        <Tag color="blue" style={{ marginTop: 8 }}>
                          {item.device.category.name}
                        </Tag>
                      )}
                      <Space style={{ marginTop: 8 }}>
                        <Tag 
                          color={availability.color} 
                          icon={<CheckCircleOutlined />}
                        >
                          {availability.text}
                        </Tag>
                      </Space>
                    </div>

                    <Descriptions column={1} size="small" bordered>
                      <Descriptions.Item label="Số lượng mượn">
                        <Space>
                          <InputNumber
                            min={1}
                            max={maxQuantity}
                            value={currentQuantity}
                            onChange={(value) => handleQuantityChange(item.device._id, value)}
                            disabled={!isAvailable}
                            style={{ width: '120px' }}
                          />
                          {isAvailable && (
                            <Text type="secondary">
                              (Tối đa: {maxQuantity})
                            </Text>
                          )}
                        </Space>
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

                    <Space style={{ marginTop: 16 }}>
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemove(item.device._id)}
                      >
                        Xóa
                      </Button>
                    </Space>
                  </Space>
                </div>
              </Space>
            </Card>
          );
        })}

      </Space>

      {/* Footer Bar - Fixed at bottom */}
      <FooterBar>
        <FooterContent>
          <FooterLeft>
            <Checkbox
              checked={isAllSelected}
              indeterminate={isIndeterminate}
              onChange={(e) => handleSelectAll(e.target.checked)}
            >
              <Text strong>Chọn tất cả ({availableItems.length})</Text>
            </Checkbox>
            <Button 
              type="link" 
              danger 
              onClick={handleRemoveSelected}
              disabled={selectedItems.size === 0}
            >
              Xóa
            </Button>
          </FooterLeft>

          <FooterRight>
            <Space size="large" align="center">
              <div style={{ textAlign: 'right' }}>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Đã chọn: <Text strong>{totalSelectedProducts}</Text> sản phẩm
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Tổng số lượng: <Text strong style={{ color: '#1890ff' }}>{totalSelectedQuantity}</Text>
                </Text>
              </div>
              <Button
                type="primary"
                size="large"
                onClick={handleRegisterBorrowSelected}
                disabled={selectedItems.size === 0}
                style={{ 
                  height: '48px', 
                  paddingLeft: '32px', 
                  paddingRight: '32px',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                Đăng ký mượn ({totalSelectedProducts})
              </Button>
            </Space>
          </FooterRight>
        </FooterContent>
      </FooterBar>
    </Container>
  );
};

export default Cart;

