import React, { useState, useEffect } from 'react';
import { Layout, Badge, Avatar, Dropdown, Button, Space, Typography } from 'antd';
import {
  ShoppingCartOutlined,
  BellOutlined,
  MessageOutlined,
  HistoryOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import './style.js';

const { Header: AntHeader } = Layout;
const { Title } = Typography;

const Header = () => {
  const navigate = useNavigate();
  // Safe check context
  const cartContext = useCart();
  const cartCount = cartContext ? cartContext.cartCount : 0;

  const [user, setUser] = useState(null);

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      setUser(JSON.parse(userString));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Menu Dropdown cho Student và Lab Manager
  const menuItems = [
    {
      key: 'profile',
      label: 'Hồ sơ cá nhân',
      icon: <UserOutlined />,
      onClick: () => navigate('/profile'),
    },
    {
      key: 'change-pass',
      label: 'Đổi mật khẩu',
      icon: <SettingOutlined />,
      onClick: () => navigate('/change-password'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Đăng xuất',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  // Logic hiển thị icon chức năng
  const renderIcons = () => {
    const role = user?.role;

    // Icon chung (Tin nhắn, Thông báo)
    const commonIcons = (
      <>
        <Button
          type="text"
          icon={<Badge count={0} size="small"><MessageOutlined style={{ fontSize: 20 }} /></Badge>}
          onClick={() => navigate('/chat')}
        />
        <Button
          type="text"
          icon={<Badge count={5} size="small"><BellOutlined style={{ fontSize: 20 }} /></Badge>}
        />
      </>
    );

    // Nếu là Student thì thêm Giỏ hàng và Lịch sử
    if (role === 'student') {
      return (
        <Space size="middle">
          <Button
            type="text"
            icon={<HistoryOutlined style={{ fontSize: 20 }} />}
            onClick={() => navigate('/student/borrowed')}
            title="Lịch sử mượn"
          />
          <Button
            type="text"
            icon={
              <Badge count={cartCount} size="small">
                <ShoppingCartOutlined style={{ fontSize: 20 }} />
              </Badge>
            }
            onClick={() => navigate('/student/cart')}
            title="Giỏ hàng"
          />
          {commonIcons}
        </Space>
      );
    }

    // Lab Manager và School Admin chỉ hiện icon chung
    return <Space size="middle">{commonIcons}</Space>;
  };

  return (
    <AntHeader
      style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        zIndex: 999,
        position: 'sticky',
        top: 0,
        height: '64px'
      }}
    >
      {/* Logo */}
      <div className="header-left" style={{ display: 'flex', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0, color: '#1890ff', cursor: 'pointer' }} onClick={() => navigate('/')}>
          InFraLAB
        </Title>
      </div>

      {/* Right Side */}
      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

        {/* Render Icons */}
        {renderIcons()}

        {/* LOGIC QUAN TRỌNG: Chỉ hiện Avatar + Tên nếu KHÔNG PHẢI là School Admin */}
        {/* Tức là chỉ hiện cho Student và Lab Manager */}
        {user && user.role !== 'school_admin' && (
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
            <Space style={{ cursor: 'pointer', marginLeft: 8 }}>
              <Avatar
                src={user?.avatar}
                icon={<UserOutlined />}
                style={{ backgroundColor: '#1890ff' }}
              />
              <span style={{ display: 'none', md: 'inline-block', fontWeight: 500 }}>
                {user?.name || user?.username || 'User'}
              </span>
            </Space>
          </Dropdown>
        )}
      </div>
    </AntHeader>
  );
};

export default Header;