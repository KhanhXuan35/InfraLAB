import React, { useState, useEffect } from 'react';
import { Badge, Dropdown, List, Typography, Button, Empty, Tag, Space } from 'antd';
import { BellOutlined, CheckCircleOutlined, CloseCircleOutlined, CheckSquareOutlined } from '@ant-design/icons';
import api from '../../services/api';

// Helper function để format thời gian
const formatTimeAgo = (date) => {
  if (!date) return '';
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return then.toLocaleDateString('vi-VN');
};

const { Text } = Typography;

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/user-dashboard/notifications?limit=20');
      console.log('Notifications response:', res); // Debug log
      if (res && res.success) {
        const notifs = Array.isArray(res.data) ? res.data : [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
      } else if (Array.isArray(res)) {
        // Nếu API trả về trực tiếp array
        setNotifications(res);
        setUnreadCount(res.filter(n => !n.read).length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Polling mỗi 30 giây để cập nhật thông báo mới
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/user-dashboard/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/user-dashboard/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'borrow_approved':
        return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />;
      case 'borrow_rejected':
        return <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />;
      case 'borrow_delivered':
        return <CheckSquareOutlined style={{ color: '#1890ff', fontSize: 20 }} />;
      case 'new_device_request':
        return <BellOutlined style={{ color: '#faad14', fontSize: 20 }} />;
      default:
        return <BellOutlined style={{ fontSize: 20 }} />;
    }
  };

  const getNotificationTag = (type) => {
    switch (type) {
      case 'borrow_approved':
        return <Tag color="green">Đã duyệt</Tag>;
      case 'borrow_rejected':
        return <Tag color="red">Từ chối</Tag>;
      case 'borrow_delivered':
        return <Tag color="blue">Đã giao</Tag>;
      case 'new_device_request':
        return <Tag color="orange">Yêu cầu mới</Tag>;
      default:
        return null;
    }
  };

  const dropdownContent = (
    <div style={{ 
      background: '#fff', 
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      width: '380px',
      maxHeight: '500px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#fafafa',
        borderRadius: '8px 8px 0 0'
      }}>
        <Text strong style={{ fontSize: '16px' }}>Thông báo</Text>
        {unreadCount > 0 && (
          <Button 
            type="link" 
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              markAllAsRead();
            }}
          >
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      {/* Content */}
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Text type="secondary">Đang tải...</Text>
          </div>
        ) : notifications.length === 0 ? (
          <Empty 
            description="Không có thông báo" 
            style={{ padding: '40px 20px' }}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  backgroundColor: !item.read ? '#f0f7ff' : 'transparent',
                  borderLeft: !item.read ? '3px solid #1890ff' : 'none',
                  transition: 'background-color 0.2s'
                }}
                onClick={() => {
                  if (!item.read) {
                    markAsRead(item._id);
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f7ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = !item.read ? '#f0f7ff' : 'transparent';
                }}
              >
                <List.Item.Meta
                  avatar={getNotificationIcon(item.type)}
                  title={
                    <Space>
                      <Text strong={!item.read} style={{ fontSize: '14px' }}>
                        {item.message}
                      </Text>
                      {getNotificationTag(item.type)}
                    </Space>
                  }
                  description={
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {formatTimeAgo(item.createdAt)}
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => dropdownContent}
      trigger={['click']}
      placement="bottomRight"
      open={open}
      onOpenChange={setOpen}
    >
      <Badge count={unreadCount} offset={[-5, 5]}>
        <BellOutlined 
          style={{ 
            fontSize: 20, 
            cursor: 'pointer',
            color: unreadCount > 0 ? '#1890ff' : 'inherit',
            transition: 'color 0.2s'
          }} 
          onClick={() => setOpen(!open)}
        />
      </Badge>
    </Dropdown>
  );
};

export default NotificationBell;

