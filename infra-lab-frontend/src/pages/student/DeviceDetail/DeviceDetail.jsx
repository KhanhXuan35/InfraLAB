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
  InputNumber,
  Modal,
  Table,
  Empty,
  Popover
} from 'antd';
import { 
  ArrowLeftOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../../services/api';
import { Container, DetailCard, ImageContainer, ActionSection } from './style';
import { STUDENT_ROUTES } from '../../../constants/routes';
import { useCart } from '../../../contexts/CartContext';
import { conversationService } from '../../../services/conversationService';

const { Title, Text, Paragraph } = Typography;

const DeviceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [borrowHistory, setBorrowHistory] = useState([]);
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

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

  const fetchBorrowHistory = async (page = 1) => {
    if (!device?._id) return;
    
    setHistoryLoading(true);
    try {
      const response = await api.get(`/borrow/device/${device._id}/history`, {
        params: {
          page,
          limit: historyPagination.limit,
        },
      });

      if (response.success) {
        setBorrowHistory(response.data || []);
        setHistoryPagination({
          ...historyPagination,
          page: response.pagination?.page || page,
          total: response.pagination?.total || 0,
        });
      } else {
        message.error(response.message || 'Không thể tải lịch sử mượn');
      }
    } catch (error) {
      console.error('Error fetching borrow history:', error);
      message.error(error.message || 'Có lỗi xảy ra khi tải lịch sử mượn');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenHistory = () => {
    setHistoryModalVisible(true);
    fetchBorrowHistory(1);
  };

  const handleHistoryPageChange = (page) => {
    fetchBorrowHistory(page);
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      borrowed: { color: 'blue', text: 'Đang mượn' },
      return_pending: { color: 'orange', text: 'Chờ trả' },
      returned: { color: 'green', text: 'Đã trả' },
    };
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // Handle chat with user
  const handleChatWithUser = async (studentId) => {
    if (!studentId) {
      message.error('Không tìm thấy thông tin người dùng');
      return;
    }

    try {
      // Đóng modal lịch sử
      setHistoryModalVisible(false);
      
      // Lấy danh sách conversations để kiểm tra xem đã có conversation với user này chưa
      const conversationsResponse = await conversationService.getAllConversations();
      const conversations = conversationsResponse?.data || conversationsResponse || [];
      
      // Tìm conversation với user này
      const currentUser = JSON.parse(localStorage.getItem('user')) || null;
      const currentUserId = currentUser?._id || currentUser?.id;
      const studentIdStr = studentId.toString();
      const currentUserIdStr = currentUserId?.toString();
      
      const existingConversation = conversations.find((conv) => {
        const participants = conv.participants || [];
        return participants.some((p) => {
          const participantId = (p._id || p.id)?.toString();
          return participantId === studentIdStr && participantId !== currentUserIdStr;
        });
      });

      if (existingConversation && existingConversation._id) {
        // Nếu đã có conversation, điều hướng đến conversation đó
        navigate(`${STUDENT_ROUTES.Conversation}/${existingConversation._id}`);
      } else {
        // Nếu chưa có, tạo conversation mới (API sẽ trả về conversation đã tồn tại nếu có)
        const createResponse = await conversationService.createConversation(studentId);
        const newConversation = createResponse?.data || createResponse;
        
        if (newConversation?._id) {
          navigate(`${STUDENT_ROUTES.Conversation}/${newConversation._id}`);
        } else {
          message.error('Không thể tạo cuộc trò chuyện');
        }
      }
    } catch (error) {
      console.error('Error handling chat:', error);
      message.error('Có lỗi xảy ra khi mở chat');
    }
  };

  const historyColumns = [
    {
      title: 'Sinh viên',
      key: 'student',
      render: (_, record) => {
        const studentId = record.student?._id || record.student?.id;
        const studentName = record.student?.name || 'N/A';
        const hasStudentId = !!studentId;
        
        const chatContent = (
          <div style={{ padding: '4px 0', fontSize: '13px', color: '#666' }}>
            Chat with
          </div>
        );

        // Chỉ hiển thị popover và cho phép click nếu có studentId
        if (hasStudentId) {
          return (
            <Popover
              content={chatContent}
              trigger="hover"
              placement="top"
              overlayStyle={{ padding: '4px' }}
            >
              <div 
                style={{ 
                  cursor: 'pointer',
                  padding: '4px 0'
                }}
                onClick={() => handleChatWithUser(studentId)}
              >
                <div 
                  className="student-name-link"
                  style={{ 
                    fontWeight: 500, 
                    transition: 'color 0.2s',
                    color: 'inherit'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#1890ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'inherit';
                  }}
                >
                  {studentName}
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {record.student?.student_code || record.student?.email}
                </Text>
              </div>
            </Popover>
          );
        }

        // Nếu không có studentId, chỉ hiển thị tên
        return (
          <div style={{ padding: '4px 0' }}>
            <div style={{ fontWeight: 500 }}>{studentName}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.student?.student_code || record.student?.email}
            </Text>
          </div>
        );
      },
      width: 200,
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center',
    },
    {
      title: 'Ngày mượn',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
      width: 120,
    },
    {
      title: 'Hạn trả',
      dataIndex: 'return_due_date',
      key: 'return_due_date',
      render: (date, record) => {
        const dueDate = dayjs(date);
        const isOverdue = dueDate.isBefore(dayjs()) && !record.returned;
        return (
          <Text style={{ color: isOverdue ? '#ff4d4f' : 'inherit' }}>
            {dueDate.format('DD/MM/YYYY')}
            {isOverdue && <Tag color="red" style={{ marginLeft: 8 }}>Quá hạn</Tag>}
          </Text>
        );
      },
      width: 150,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      width: 120,
    },
    {
      title: 'Mục đích',
      dataIndex: 'purpose',
      key: 'purpose',
      ellipsis: true,
    },
  ];

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

  // Kiểm tra thiết bị có inventory tại lab không
  if (!device.inventory || device.inventory.location !== 'lab') {
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
          message="Thiết bị không có sẵn"
          description="Thiết bị này không có tại phòng Lab"
          type="warning"
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
                    <Button
                      icon={<HistoryOutlined />}
                      size="large"
                      block
                      onClick={handleOpenHistory}
                      style={{ marginTop: '8px', height: '48px', fontSize: '16px' }}
                    >
                      Xem lịch sử mượn
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

      {/* History Modal */}
      <Modal
        title="Lịch sử mượn thiết bị"
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setHistoryModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={900}
      >
        <Spin spinning={historyLoading}>
          {borrowHistory.length === 0 ? (
            <Empty
              description="Chưa có lịch sử mượn từ người khác"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Table
              columns={historyColumns}
              dataSource={borrowHistory}
              rowKey="_id"
              pagination={{
                current: historyPagination.page,
                pageSize: historyPagination.limit,
                total: historyPagination.total,
                showSizeChanger: false,
                showTotal: (total) => `Tổng ${total} bản ghi`,
                onChange: handleHistoryPageChange,
              }}
            />
          )}
        </Spin>
      </Modal>
    </Container>
  );
};

export default DeviceDetail;

