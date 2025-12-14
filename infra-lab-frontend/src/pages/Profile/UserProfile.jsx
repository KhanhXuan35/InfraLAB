import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Avatar,
  Button,
  Typography,
  message,
  Spin
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import EditProfile from './EditProfile';
import * as S from './UserProfile.styles';
import './UserProfile.css';

const { Title, Text } = Typography;

const UserProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userString = localStorage.getItem('user');
      if (userString) {
        const userData = JSON.parse(userString);

        const processedUserData = {
          ...userData,
          isActive: userData.isActive === true || userData.isActive === 'true' || userData.isActive === 1,
          verified: userData.verified === true || userData.verified === 'true' || userData.verified === 1,
        };

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

  const getRoleLabel = (role) => {
    const roleMap = {
      'student': 'Sinh viên',
      'lab_manager': 'Giảng viên',
      'school_admin': 'Quản trị viên trường'
    };
    return roleMap[role] || role;
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" tip="Đang tải..." /></div>;
  }

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Text type="danger">Không tìm thấy thông tin người dùng</Text>
        <br />
        <Button style={{ marginTop: 16 }} onClick={() => navigate(-1)}>Quay lại</Button>
      </div>
    );
  }

  // --- RENDER GIAO DIỆN (Đã bỏ Layout, Sider, Header cũ) ---
  return (
    <div className="user-profile-content">
      {/* Tiêu đề trang */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ marginRight: 16, border: 'none', background: 'transparent', boxShadow: 'none' }}
        />
        <Title level={3} style={{ margin: 0, color: '#001529' }}>Hồ sơ cá nhân</Title>
      </div>

      <Card
        style={{
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          maxWidth: 1000,
          margin: '0 auto'
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
              color: (user.isActive) ? '#52c41a' : '#ff4d4f',
              fontWeight: 600
            }}>
              {(user.isActive) ? '✓ Đang hoạt động' : '✗ Đã khóa'}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Xác thực email">
            <span style={{
              color: (user.verified) ? '#52c41a' : '#faad14',
              fontWeight: 600
            }}>
              {(user.verified) ? '✓ Đã xác thực' : '⚠ Chưa xác thực'}
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
                day: 'numeric'
              })}
            </Descriptions.Item>
          )}
          {user.updatedAt && (
            <Descriptions.Item label="Cập nhật lần cuối">
              {new Date(user.updatedAt).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
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

      {/* Edit Profile Modal (Giữ nguyên) */}
      <EditProfile
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onSuccess={(updatedUser) => {
          setUser(updatedUser);
          message.success('Thông tin đã được cập nhật');
        }}
        user={user}
      />
    </div>
  );
};

export default UserProfile;