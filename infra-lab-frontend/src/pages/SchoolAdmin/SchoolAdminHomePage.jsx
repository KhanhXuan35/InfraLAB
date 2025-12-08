import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Button,
  Space,
  Avatar,
  Empty,
  Menu
} from 'antd';
import {
  DashboardOutlined,
  BankOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined,
  TeamOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import * as S from './SchoolAdminHomePage.styles';

const { Header: LayoutHeader, Sider, Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const SchoolAdminHomePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalDevices: 0,
    totalSchools: 0,
    pendingRequests: 0,
    activeLabs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState('overview');

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      const userData = JSON.parse(userString);
      setUser(userData);
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // TODO: Gọi API để lấy stats
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    {
      key: 'overview',
      icon: <DashboardOutlined />,
      label: 'Tổng quan',
    },
    {
      key: 'schools',
      icon: <BankOutlined />,
      label: 'Quản lý trường học',
    },
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
      key: 'users',
      icon: <UserOutlined />,
      label: 'Quản lý người dùng',
    },
    {
      key: 'reports',
      icon: <FileTextOutlined />,
      label: 'Báo cáo',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt',
    },
  ];

  const quickActions = [
    {
      title: 'Quản lý thiết bị',
      icon: <ToolOutlined />,
      color: '#1890ff',
      onClick: () => navigate('/devices'),
    },
    {
      title: 'Duyệt yêu cầu',
      icon: <CheckCircleOutlined />,
      color: '#52c41a',
      onClick: () => navigate('/requests'),
    },
    {
      title: 'Quản lý người dùng',
      icon: <TeamOutlined />,
      color: '#722ed1',
      onClick: () => navigate('/users'),
    },
    {
      title: 'Xem báo cáo',
      icon: <FileTextOutlined />,
      color: '#faad14',
      onClick: () => navigate('/reports'),
    },
  ];

  if (loading) {
    return <S.LoadingContainer>Đang tải...</S.LoadingContainer>;
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
        <div style={{ padding: 24, textAlign: 'center', borderBottom: '1px solid #303030' }}>
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            InFra<span style={{ color: '#1890ff' }}>Lab</span>
          </Title>
          <Text type="secondary" style={{ color: '#8c8c8c', fontSize: 12 }}>
            QUẢN TRỊ HỆ THỐNG
          </Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedMenu]}
          items={menuItems}
          style={{ borderRight: 0, marginTop: 16 }}
          onSelect={({ key }) => setSelectedMenu(key)}
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
            Dashboard Quản trị Hệ thống
          </Title>
          <Space>
            <Text>Xin chào, {user?.name || 'Admin'}!</Text>
            <Avatar style={{ backgroundColor: '#1890ff' }}>
              {user?.name?.charAt(0) || 'A'}
            </Avatar>
          </Space>
        </LayoutHeader>

        <Content style={{ margin: '24px', minHeight: 280 }}>
          {/* Welcome Section */}
          <Card style={{ marginBottom: 24 }}>
            <Title level={3} style={{ marginBottom: 8 }}>
              Quản trị Hệ thống Quản lý Lab
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Quản lý toàn bộ hệ thống, thiết bị và người dùng trên nền tảng InfraLab
            </Paragraph>
          </Card>

          {/* Stats Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Tổng thiết bị"
                  value={stats.totalDevices}
                  prefix={<ToolOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Tổng trường học"
                  value={stats.totalSchools}
                  prefix={<BankOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Yêu cầu chờ duyệt"
                  value={stats.pendingRequests}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Phòng Lab hoạt động"
                  value={stats.activeLabs}
                  prefix={<BankOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {/* Quick Actions */}
            <Col xs={24} lg={14}>
              <Card title="Hành động nhanh">
                <Row gutter={[12, 12]}>
                  {quickActions.map((action, index) => (
                    <Col xs={12} sm={6} key={index}>
                      <Card
                        hoverable
                        onClick={action.onClick}
                        style={{
                          textAlign: 'center',
                          cursor: 'pointer',
                          background: `linear-gradient(135deg, ${action.color}15 0%, ${action.color}05 100%)`,
                        }}
                        bodyStyle={{ padding: '24px 16px' }}
                      >
                        <div style={{ fontSize: 36, color: action.color, marginBottom: 12 }}>
                          {action.icon}
                        </div>
                        <Text strong style={{ fontSize: 13 }}>
                          {action.title}
                        </Text>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>

            {/* Recent Activities */}
            <Col xs={24} lg={10}>
              <Card title="Hoạt động gần đây" extra={<Button type="link">Xem tất cả</Button>}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Chưa có hoạt động nào"
                  style={{ padding: '40px 0' }}
                />
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
};

export default SchoolAdminHomePage;
