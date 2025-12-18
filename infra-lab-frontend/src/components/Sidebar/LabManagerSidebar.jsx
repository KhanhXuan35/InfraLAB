import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Typography } from 'antd';
import {
  DashboardOutlined,
  ToolOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  BellOutlined,
  AppstoreOutlined,
  LogoutOutlined,
  MessageOutlined,
  TeamOutlined,
  SwapOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;
const { Text } = Typography;

const LabManagerSidebar = () => {
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
    if (path === '/teacher-dashboard') return 'overview';
    if (path === '/lab-manager/devices' || path.startsWith('/lab-manager/device/')) return 'devices';
    if (path === '/lab-manager/school-devices') return 'school-inventory';
  if (path === '/lab-manager/borrow-return') return 'borrow';
  if (path === '/lab-manager/borrow-approval') return 'borrow-approval';
    if (path === '/lab-manager/repairs' || path.startsWith('/lab-manager/repairs/')) return 'repairs';
    if (path === '/lab-manager/students') return 'students';
    if (path === '/lab-manager/certificates') return 'certificates';
    if (path === '/reports') return 'reports';
    if (path === '/notifications') return 'notifications';
    if (path === '/chat' || path.startsWith('/chat/')) return 'chat';
    return 'overview';
  };

  const menuItems = [
    {
      key: 'overview',
      icon: <DashboardOutlined />,
      label: 'Thống kê',
    },
    {
      key: 'devices',
      icon: <ToolOutlined />,
      label: 'Quản lý thiết bị',
    },
    {
      key: 'school-inventory',
      icon: <AppstoreOutlined />,
      label: 'Kho School',
    },
    {
      key: 'borrow',
      icon: <SwapOutlined />,
      label: 'Mượn/Trả',
    },
    {
      key: 'borrow-approval',
      icon: <SwapOutlined />,
      label: 'Duyệt mượn',
    },
    {
      key: 'repairs',
      icon: <ToolOutlined />,
      label: 'Danh sách sửa chữa',
    },
    {
      key: 'students',
      icon: <TeamOutlined />,
      label: 'Quản lý sinh viên',
    },
    {
      key: 'certificates',
      icon: <SafetyCertificateOutlined />,
      label: 'Chứng nhận',
    },
    {
      key: 'reports',
      icon: <FileTextOutlined />,
      label: 'Báo cáo',
    },
    {
      key: 'chat',
      icon: <MessageOutlined />,
      label: 'Tin nhắn',
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: 'Thông báo',
    },
  ];

  const handleMenuSelect = ({ key }) => {
    switch (key) {
      case 'overview':
        navigate('/teacher-dashboard');
        break;
      case 'devices':
        navigate('/lab-manager/devices');
        break;
      case 'school-inventory':
        navigate('/lab-manager/school-devices');
        break;
      case 'borrow':
        navigate('/lab-manager/borrow-return');
        break;
      case 'borrow-approval':
        navigate('/lab-manager/borrow-approval');
        break;
      case 'repairs':
        navigate('/lab-manager/repairs');
        break;
      case 'students':
        navigate('/lab-manager/students');
        break;
      case 'certificates':
        navigate('/lab-manager/certificates');
        break;
      case 'reports':
        navigate('/reports');
        break;
      case 'chat':
        navigate('/chat');
        break;
      case 'notifications':
        navigate('/notifications');
        break;
      default:
        break;
    }
  };

  return (
    <Sider
      width={240}
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
        onClick={() => navigate('/teacher-dashboard')}
      >
        <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
          InFra<span style={{ color: '#1890ff' }}>Lab</span>
        </Typography.Title>
        <Text type="secondary" style={{ color: '#8c8c8c', fontSize: 12 }}>
          QUẢN LÝ PHÒNG LAB
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

export default LabManagerSidebar;

