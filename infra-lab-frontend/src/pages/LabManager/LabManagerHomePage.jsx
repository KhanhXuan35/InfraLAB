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
  List,
  Tag,
  Divider,
  Menu
} from 'antd';
import {
  DashboardOutlined,
  ToolOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  BellOutlined,
  PlusOutlined,
  SwapOutlined,
  SearchOutlined,
  ExportOutlined,
  LogoutOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import * as S from './LabManagerHomePage.styles';

const { Header: LayoutHeader, Sider, Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const LabManagerHomePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalAssets: 292,
    active: 272,
    underRepair: 9,
    broken: 20,
  });
  const [loading, setLoading] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState('dashboard');

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
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Thống kê',
    },
    {
      key: 'devices',
      icon: <ToolOutlined />,
      label: 'Quản lý thiết bị',
    },
    {
      key: 'borrow',
      icon: <ShoppingOutlined />,
      label: 'Mượn/Trả',
    },
    {
      key: 'reports',
      icon: <FileTextOutlined />,
      label: 'Báo cáo',
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: 'Thông báo',
    },
  ];

  const quickActions = [
    {
      title: 'Yêu cầu thêm thiết bị',
      icon: <PlusOutlined />,
      color: '#1890ff',
      key: 'add-device',
    },
    {
      title: 'Ghi nhận mượn/trả',
      icon: <SwapOutlined />,
      color: '#722ed1',
      key: 'record',
    },
    {
      title: 'Tìm kiếm thiết bị',
      icon: <SearchOutlined />,
      color: '#faad14',
      key: 'search',
    },
    {
      title: 'Xuất báo cáo',
      icon: <ExportOutlined />,
      color: '#52c41a',
      key: 'export',
    },
  ];

  if (loading) {
    return <S.LoadingContainer>Đang tải...</S.LoadingContainer>;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={250}
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
            QUẢN LÝ PHÒNG LAB
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

      <Layout style={{ marginLeft: 250 }}>
        <LayoutHeader style={{ 
          background: '#fff', 
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Title level={4} style={{ margin: 0 }}>
            Dashboard Quản lý Lab
          </Title>
          <Space>
            <Text>Xin chào, {user?.name || 'Giáo viên'}!</Text>
            <Avatar style={{ backgroundColor: '#1890ff' }}>
              {user?.name?.charAt(0) || 'G'}
            </Avatar>
          </Space>
        </LayoutHeader>

        <Content style={{ margin: '24px', minHeight: 280 }}>
          {/* Stats Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Tổng tài sản"
                  value={stats.totalAssets}
                  prefix={<ToolOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Đang hoạt động"
                  value={stats.active}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Đang sửa chữa"
                  value={stats.underRepair}
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Hỏng/Thay thế"
                  value={stats.broken}
                  prefix={<CloseCircleOutlined />}
                  valueStyle={{ color: '#f5222d' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {/* Recent Activities */}
            <Col xs={24} lg={12}>
              <Card title="Hoạt động gần đây" extra={<Button type="link">Xem tất cả</Button>}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Chưa có hoạt động nào"
                />
              </Card>
            </Col>

            {/* Quick Actions */}
            <Col xs={24} lg={12}>
              <Card title="Hành động nhanh">
                <Row gutter={[12, 12]}>
                  {quickActions.map((action, index) => (
                    <Col xs={12} key={index}>
                      <Card
                        hoverable
                        style={{
                          textAlign: 'center',
                          background: `linear-gradient(135deg, ${action.color}15 0%, ${action.color}05 100%)`,
                        }}
                        bodyStyle={{ padding: '20px 12px' }}
                      >
                        <div style={{ fontSize: 32, color: action.color, marginBottom: 8 }}>
                          {action.icon}
                        </div>
                        <Text strong style={{ fontSize: 12 }}>
                          {action.title}
                        </Text>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
};

export default LabManagerHomePage;
