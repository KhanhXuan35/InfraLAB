import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layout, 
  Card, 
  Descriptions, 
  Avatar, 
  Button, 
  Space, 
  Typography, 
  Spin, 
  message,
  Menu
} from 'antd';
import { 
  UserOutlined, 
  EditOutlined, 
  ArrowLeftOutlined,
  DashboardOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import EditProfile from './EditProfile';
import * as S from './UserProfile.styles';
import './UserProfile.css';

const { Header: LayoutHeader, Sider, Content } = Layout;
const { Title, Text } = Typography;

const UserProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState('profile');
  const [editModalVisible, setEditModalVisible] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  // Debug: Log user data whenever it changes
  useEffect(() => {
    if (user) {
      console.log('=== USER DATA DEBUG ===');
      console.log('Full user object:', user);
      console.log('username:', user.username);
      console.log('email:', user.email);
      console.log('isActive:', user.isActive, 'type:', typeof user.isActive);
      console.log('verified:', user.verified, 'type:', typeof user.verified);
      console.log('======================');
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      // Lấy thông tin user từ localStorage
      const userString = localStorage.getItem('user');
      if (userString) {
        const userData = JSON.parse(userString);
        console.log('=== LOADING USER PROFILE ===');
        console.log('Raw localStorage data:', userData);
        console.log('username:', userData.username);
        console.log('email:', userData.email);
        console.log('isActive:', userData.isActive, 'type:', typeof userData.isActive);
        console.log('verified:', userData.verified, 'type:', typeof userData.verified);
        
        // Đảm bảo các giá trị boolean được xử lý đúng
        const processedUserData = {
          ...userData,
          // Xử lý isActive
          isActive: userData.isActive === true || userData.isActive === 'true' || userData.isActive === 1,
          // Xử lý verified
          verified: userData.verified === true || userData.verified === 'true' || userData.verified === 1,
        };
        
        console.log('Processed user data:', processedUserData);
        console.log('===========================');
        
        setUser(processedUserData);
      } else {
        message.error('Không tìm thấy thông tin người dùng');
        navigate('/login');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      message.error('Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // Navigate về trang chủ theo role
    const userString = localStorage.getItem('user');
    if (userString) {
      const userData = JSON.parse(userString);
      const role = userData?.role;
      if (role === 'school_admin') {
        navigate('/reports');
      } else if (role === 'lab_manager') {
        navigate('/reports');
      } else if (role === 'student') {
        navigate('/user-dashboard');
      } else {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  const getRoleLabel = (role) => {
    const roleMap = {
      'student': 'Sinh viên',
      'lab_manager': 'Giảng viên',
      'school_admin': 'Quản trị viên trường'
    };
    return roleMap[role] || role;
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getMenuItems = () => {
    const baseItems = [
      {
        key: 'overview',
        icon: <DashboardOutlined />,
        label: 'Tổng quan',
      },
    ];

    if (user?.role === 'school_admin') {
      return [
        ...baseItems,
        {
          key: 'devices',
          icon: <ToolOutlined />,
          label: 'Quản lý thiết bị',
        },
        {
          key: 'requests',
          icon: <CheckCircleOutlined />,
          label: 'Duyệt yêu cầu',
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
          key: 'profile',
          icon: <UserOutlined />,
          label: 'Thông tin cá nhân',
        },
      ];
    } else if (user?.role === 'lab_manager') {
      return [
        ...baseItems,
        {
          key: 'devices',
          icon: <ToolOutlined />,
          label: 'Quản lý thiết bị',
        },
        {
          key: 'profile',
          icon: <UserOutlined />,
          label: 'Thông tin cá nhân',
        },
      ];
    } else {
      return [
        ...baseItems,
        {
          key: 'profile',
          icon: <UserOutlined />,
          label: 'Thông tin cá nhân',
        },
      ];
    }
  };

  const handleMenuSelect = ({ key }) => {
    setSelectedMenu(key);
    if (key === 'overview') {
      if (user?.role === 'school_admin') {
        navigate('/reports');
      } else if (user?.role === 'lab_manager') {
        navigate('/reports');
      } else if (user?.role === 'student') {
        navigate('/user-dashboard');
      }
    } else if (key === 'devices') {
      if (user?.role === 'school_admin') {
        navigate('/school/dashboard');
      } else if (user?.role === 'lab_manager') {
        navigate('/lab-manager/devices');
      }
    } else if (key === 'requests') {
      navigate('/requests');
    } else if (key === 'reports') {
      navigate('/reports');
    } else if (key === 'settings') {
      navigate('/settings');
    }
    // profile key stays on same page
  };

  if (loading) {
    return <S.LoadingContainer>Đang tải...</S.LoadingContainer>;
  }

  if (!user) {
    return (
      <S.ErrorContainer>
        <Text>Không tìm thấy thông tin người dùng</Text>
        <Button onClick={handleBack}>Quay lại</Button>
      </S.ErrorContainer>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={260}
        style={{
          background: '#001529',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          overflow: 'auto',
        }}
      >
        <div 
          style={{ padding: 24, textAlign: 'center', borderBottom: '1px solid #303030', cursor: 'pointer' }}
          onClick={handleBack}
        >
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            InFra<span style={{ color: '#1890ff' }}>Lab</span>
          </Title>
          <Text type="secondary" style={{ color: '#8c8c8c', fontSize: 12 }}>
            {user?.role === 'school_admin' ? 'QUẢN TRỊ HỆ THỐNG' : 
             user?.role === 'lab_manager' ? 'GIẢNG VIÊN' : 'SINH VIÊN'}
          </Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedMenu]}
          items={getMenuItems()}
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
            cursor: 'pointer',
          }}
          onClick={handleLogout}
        >
          <Button
            type="text"
            icon={<LogoutOutlined />}
            style={{ width: '100%', color: '#fff' }}
          >
            Đăng xuất
          </Button>
        </div>
      </Sider>

      <Layout style={{ marginLeft: 260 }}>
        <LayoutHeader style={{ 
          background: '#fff', 
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Title level={4} style={{ margin: 0 }}>
            Thông tin cá nhân
          </Title>
          <Space>
            <Text>Xin chào, {user?.name || user?.fullName || 'Người dùng'}!</Text>
            <Avatar style={{ backgroundColor: '#1890ff' }}>
              {user?.name?.charAt(0) || user?.fullName?.charAt(0) || 'U'}
            </Avatar>
          </Space>
        </LayoutHeader>

        <Content style={{ margin: '24px', minHeight: 280 }}>
          <Card 
            style={{ 
              marginBottom: 24,
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              marginBottom: 32,
              paddingBottom: 24,
              borderBottom: '1px solid #f0f0f0'
            }}>
              <Avatar 
                size={120} 
                src={user?.avatar || null}
                style={{ 
                  backgroundColor: '#1890ff',
                  marginBottom: 16,
                  fontSize: 48
                }}
                icon={!user?.avatar && <UserOutlined />}
              >
                {!user?.avatar && (user?.name?.charAt(0) || user?.fullName?.charAt(0) || 'U')}
              </Avatar>
              <Title level={2} style={{ marginBottom: 8 }}>
                {user.name || user.fullName || 'Chưa cập nhật'}
              </Title>
              <Text type="secondary" style={{ fontSize: 16 }}>
                {user.email || 'Chưa cập nhật'}
              </Text>
              <div style={{ marginTop: 8 }}>
                <Text 
                  style={{ 
                    padding: '4px 12px',
                    borderRadius: 12,
                    backgroundColor: '#e6f7ff',
                    color: '#1890ff',
                    fontSize: 14,
                    fontWeight: 600
                  }}
                >
                  {getRoleLabel(user.role)}
                </Text>
              </div>
            </div>

            <Descriptions 
              title="Thông tin chi tiết" 
              bordered 
              column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
              style={{ marginBottom: 24 }}
            >
              <Descriptions.Item label="Họ và tên">
                {user.name || user.fullName || 'Chưa cập nhật'}
              </Descriptions.Item>
              <Descriptions.Item label="Tên đăng nhập">
                {user.username ? user.username : 'Chưa cập nhật'}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {user.email ? user.email : 'Chưa cập nhật'}
              </Descriptions.Item>
              {user.gender && (
                <Descriptions.Item label="Giới tính">
                  {user.gender === 'Male' ? 'Nam' : 
                   user.gender === 'Female' ? 'Nữ' : 
                   user.gender === 'Other' ? 'Khác' : user.gender}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Vai trò">
                {getRoleLabel(user.role)}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái tài khoản">
                <span style={{ 
                  color: (user.isActive === true || user.isActive === 'true' || user.isActive === 1) ? '#52c41a' : '#ff4d4f',
                  fontWeight: 600
                }}>
                  {(user.isActive === true || user.isActive === 'true' || user.isActive === 1) ? '✓ Đang hoạt động' : '✗ Đã khóa'}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Xác thực email">
                <span style={{ 
                  color: (user.verified === true || user.verified === 'true' || user.verified === 1) ? '#52c41a' : '#faad14',
                  fontWeight: 600
                }}>
                  {(user.verified === true || user.verified === 'true' || user.verified === 1) ? '✓ Đã xác thực' : '⚠ Chưa xác thực'}
                </span>
              </Descriptions.Item>
              {user.phone && (
                <Descriptions.Item label="Số điện thoại">
                  {user.phone || user.phoneNumber || 'Chưa cập nhật'}
                </Descriptions.Item>
              )}
              {user.department && (
                <Descriptions.Item label="Khoa/Bộ môn">
                  {user.department}
                </Descriptions.Item>
              )}
              {user.address && (
                <Descriptions.Item label="Địa chỉ">
                  {user.address}
                </Descriptions.Item>
              )}
              {user.createdAt && (
                <Descriptions.Item label="Ngày tạo tài khoản">
                  {new Date(user.createdAt).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Descriptions.Item>
              )}
              {user.updatedAt && (
                <Descriptions.Item label="Cập nhật lần cuối">
                  {new Date(user.updatedAt).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Descriptions.Item>
              )}
            </Descriptions>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end',
              paddingTop: 24,
              borderTop: '1px solid #f0f0f0'
            }}>
              <Button 
                type="primary" 
                size="large"
                icon={<EditOutlined />}
                onClick={() => setEditModalVisible(true)}
                style={{
                  borderRadius: 8,
                  height: 40,
                  paddingLeft: 24,
                  paddingRight: 24
                }}
              >
                Chỉnh sửa thông tin
              </Button>
            </div>
          </Card>
        </Content>
      </Layout>

      {/* Edit Profile Modal */}
      <EditProfile
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onSuccess={(updatedUser) => {
          setUser(updatedUser);
          message.success('Thông tin đã được cập nhật');
        }}
        user={user}
      />
    </Layout>
  );
};

export default UserProfile;

