import React, { useEffect, useState } from 'react';
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
  AppstoreOutlined,
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
    totalAssets: 0,
    active: 0,
    underRepair: 0,
    broken: 0,
  });
  const [activities, setActivities] = useState([]);
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

        const statsResponse = await api.get('/dashboard/stats');
        if (statsResponse.success) {
          setStats({
            totalAssets: statsResponse.data.total || 0,
            active: statsResponse.data.available || 0,
            underRepair: statsResponse.data.repair || 0,
            broken: statsResponse.data.broken || 0,
          });
        }

        const activitiesResponse = await api.get('/dashboard/activities?limit=10');
        if (activitiesResponse.success) {
          setActivities(activitiesResponse.data || []);
        }
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

  const handleMenuClick = ({ key }) => {
    setSelectedMenu(key);
    switch (key) {
      case 'devices':
        navigate('/lab-manager/devices');
        break;
      case 'school-inventory':
        navigate('/lab-manager/school-devices');
        break;
      case 'borrow':
        break;
      case 'reports':
        break;
      case 'notifications':
        break;
      default:
        break;
    }
  };

  const handleQuickAction = (key) => {
    switch (key) {
      case 'add-device':
        break;
      case 'record':
        break;
      case 'search':
        navigate('/lab-manager/devices');
        break;
      case 'export':
        break;
      default:
        break;
    }
  };

  const menuItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: 'Thong ke' },
    { key: 'devices', icon: <ToolOutlined />, label: 'Quan ly thiet bi' },
    { key: 'school-inventory', icon: <AppstoreOutlined />, label: 'Kho School' },
    { key: 'borrow', icon: <ShoppingOutlined />, label: 'Muon/Tra' },
    { key: 'reports', icon: <FileTextOutlined />, label: 'Bao cao' },
    { key: 'notifications', icon: <BellOutlined />, label: 'Thong bao' },
  ];

  const quickActions = [
    { title: 'Yeu cau them thiet bi', icon: <PlusOutlined />, color: '#1890ff', key: 'add-device' },
    { title: 'Ghi nhan muon/tra', icon: <SwapOutlined />, color: '#722ed1', key: 'record' },
    { title: 'Tim kiem thiet bi', icon: <SearchOutlined />, color: '#faad14', key: 'search' },
    { title: 'Xuat bao cao', icon: <ExportOutlined />, color: '#52c41a', key: 'export' },
  ];

  if (loading) {
    return <S.LoadingContainer>Dang tai...</S.LoadingContainer>;
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
            QUAN LY PHONG LAB
          </Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedMenu]}
          items={menuItems}
          style={{ borderRight: 0, marginTop: 16 }}
          onClick={handleMenuClick}
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
            Dang xuat
          </Button>
        </div>
      </Sider>

      <Layout style={{ marginLeft: 250 }}>
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
            Dashboard Quan ly Lab
          </Title>
          <Space>
            <Text>Xin chao, {user?.name || 'Giao vien'}!</Text>
            <Avatar style={{ backgroundColor: '#1890ff' }}>
              {user?.name?.charAt(0) || 'G'}
            </Avatar>
          </Space>
        </LayoutHeader>

        <Content style={{ margin: '24px', minHeight: 280 }}>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card loading={loading}>
                <Statistic
                  title="Tong tai san"
                  value={stats.totalAssets}
                  prefix={<ToolOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card loading={loading}>
                <Statistic
                  title="Dang hoat dong"
                  value={stats.active}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card loading={loading}>
                <Statistic
                  title="Dang sua chua"
                  value={stats.underRepair}
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card loading={loading}>
                <Statistic
                  title="Hong/Thay the"
                  value={stats.broken}
                  prefix={<CloseCircleOutlined />}
                  valueStyle={{ color: '#f5222d' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Hoat dong gan day" extra={<Button type="link">Xem tat ca</Button>}>
                {activities.length > 0 ? (
                  <List
                    dataSource={activities}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={
                            <Avatar
                              style={{
                                backgroundColor:
                                  item.type === 'ok'
                                    ? '#52c41a'
                                    : item.type === 'error'
                                    ? '#f5222d'
                                    : '#1890ff',
                              }}
                              icon={
                                item.type === 'ok' ? (
                                  <CheckCircleOutlined />
                                ) : item.type === 'error' ? (
                                  <CloseCircleOutlined />
                                ) : (
                                  <BellOutlined />
                                )
                              }
                            />
                          }
                          title={<Text style={{ fontSize: 14 }}>{item.message}</Text>}
                          description={
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {new Date(item.createdAt).toLocaleString('vi-VN')}
                            </Text>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chua co hoat dong nao" />
                )}
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="Hanh dong nhanh">
                <Row gutter={[12, 12]}>
                  {quickActions.map((action, index) => (
                    <Col xs={12} key={index}>
                      <Card
                        hoverable
                        onClick={() => handleQuickAction(action.key)}
                        style={{
                          textAlign: 'center',
                          background: `linear-gradient(135deg, ${action.color}15 0%, ${action.color}05 100%)`,
                          cursor: 'pointer',
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
