import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Typography } from 'antd';
import {
  DashboardOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined,
  MessageOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;
const { Text } = Typography;

const SchoolAdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Xác định menu item đang active dựa trên pathname
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/school-dashboard') return 'overview';
    if (path === '/school/dashboard') return 'devices';
    if (path === '/school/borrow-requests') return 'borrow-requests';
    if (path === '/requests' || path.startsWith('/school/repairs')) return 'requests';
    if (path === '/reports') return 'reports';
    if (path === '/settings') return 'settings';
    if (path === '/chat' || path.startsWith('/chat/')) return 'chat';
    if (path.startsWith('/school/device/') || path.startsWith('/school/devices/create')) return 'devices';
    return 'overview';
  };

  const menuItems = [
    {
      key: 'overview',
      icon: <DashboardOutlined />,
      label: 'Tổng quan',
    },
    {
      key: 'devices',
      icon: <ToolOutlined />,
      label: 'Quản lý thiết bị',
    },
    {
      key: 'borrow-requests',
      icon: <CheckCircleOutlined />,
      label: 'Yêu cầu mượn',
    },
    {
      key: 'requests',
      icon: <CheckCircleOutlined />,
      label: 'Danh sách sửa chữa',
    },
    {
      key: 'reports',
      icon: <FileTextOutlined />,
      label: 'Báo cáo',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Thông báo',
    },
    {
      key: 'chat',
      icon: <MessageOutlined />,
      label: 'Tin nhắn',
    },
  ];

  const handleMenuSelect = ({ key }) => {
    switch (key) {
      case 'overview':
        navigate('/school-dashboard');
        break;
      case 'devices':
        navigate('/school/dashboard');
        break;
      case 'borrow-requests':
        navigate('/school/borrow-requests');
        break;
      case 'requests':
        navigate('/requests');
        break;
      case 'reports':
        navigate('/reports');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'chat':
        navigate('/chat');
        break;
      default:
        break;
    }
  };

  return (
    <Sider
      width={260}
      style={{
        background: '#001529',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        overflow: 'auto',
        zIndex: 100,
      }}
    >
      <div
        style={{
          padding: 24,
          textAlign: 'center',
          borderBottom: '1px solid #303030',
          cursor: 'pointer',
        }}
        onClick={() => navigate('/school-dashboard')}
      >
        <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
          InFra<span style={{ color: '#1890ff' }}>Lab</span>
        </Typography.Title>
        <Text type="secondary" style={{ color: '#8c8c8c', fontSize: 12 }}>
          QUẢN TRỊ HỆ THỐNG
        </Text>
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        items={menuItems}
        style={{ borderRight: 0, marginTop: 16 }}
        onSelect={handleMenuSelect}
      />

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 16,
          borderTop: '1px solid #303030',
        }}
      >
        <Button
          type="text"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          style={{ width: '100%', color: '#fff' }}
        >
          Đăng xuất
        </Button>
      </div>
    </Sider>
  );
};

export default SchoolAdminSidebar;

