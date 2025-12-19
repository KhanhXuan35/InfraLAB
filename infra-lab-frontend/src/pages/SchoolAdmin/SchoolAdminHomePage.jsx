import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Empty,
  Layout
} from 'antd';
import {
  ToolOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import api from '../../services/api';
import SchoolAdminSidebar from '../../components/Sidebar/SchoolAdminSidebar';
import * as S from './SchoolAdminHomePage.styles';

const { Header: LayoutHeader, Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const SchoolAdminHomePage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalDevices: 0,
    pendingRequests: 0,
    activeDevices: 0,
    brokenDevices: 0,
  });
  const [creatingDevice, setCreatingDevice] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/school-dashboard/stats');
        if (response.success && response.data) {
          setStats({
            totalDevices: response.data.totalDevices || 0,
            pendingRequests: response.data.pendingRequests || 0,
            activeDevices: response.data.activeDevices || 0,
            brokenDevices: response.data.brokenDevices || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);


  const quickActions = [
    {
      title: 'Quản lý thiết bị',
      icon: <ToolOutlined />,
      color: '#1890ff',
      onClick: () => navigate('/school/dashboard'),
    },
    {
      title: 'Thêm thiết bị mới',
      icon: <ToolOutlined />,
      color: '#13c2c2',
      onClick: () => navigate('/school/devices/create-with-instances'),
    },
    {
      title: 'Yêu cầu mượn',
      icon: <CheckCircleOutlined />,
      color: '#13c2c2',
      onClick: () => navigate('/school/borrow-requests'),
    },
    {
      title: 'Danh sách sửa chữa',
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
  ];

  if (loading) {
    return <S.LoadingContainer>Đang tải...</S.LoadingContainer>;
  }

  // --- NỘI DUNG CHÍNH (Đã xóa Layout bao ngoài) ---
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <SchoolAdminSidebar />

      <Layout style={{ marginLeft: 260 }}>
        <LayoutHeader
          style={{
            background: '#fff',
            padding: '0 24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
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
          <Card style={{ marginBottom: 24 }}>
            <Title level={3} style={{ marginBottom: 8 }}>
              Quản trị Hệ thống Quản lý Lab
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Quản lý toàn bộ hệ thống, thiết bị và người dùng trên nền tảng InfraLab
            </Paragraph>
          </Card>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic title="Tổng thiết bị" value={stats.totalDevices} prefix={<ToolOutlined />} valueStyle={{ color: '#1890ff' }} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic title="Thiết bị hoạt động" value={stats.activeDevices} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic title="Yêu cầu chờ duyệt" value={stats.pendingRequests} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#faad14' }} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic title="Thiết bị hỏng/sửa" value={stats.brokenDevices} prefix={<ToolOutlined />} valueStyle={{ color: '#ff4d4f' }} />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <Card title="Hành động nhanh">
                <Row gutter={[12, 12]}>
                  {quickActions.map((action, index) => (
                    <Col xs={12} sm={6} key={index}>
                      <Card
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