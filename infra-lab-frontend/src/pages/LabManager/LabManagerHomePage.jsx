import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Button,
  List,
  Avatar,
  Empty,
  List,
  Tag,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  SwapOutlined,
  SearchOutlined,
  ExportOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  AppstoreOutlined,
  ToolOutlined,
  BellOutlined,
} from '@ant-design/icons';
import api from '../../services/api';
import LabManagerSidebar from '../../components/Sidebar/LabManagerSidebar';
import * as S from './LabManagerHomePage.styles';

const { Header: LayoutHeader, Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const LabManagerHomePage = () => {
  const navigate = useNavigate();
  // State dữ liệu
  const [stats, setStats] = useState({
    totalAssets: 0,
    active: 0,
    underRepair: 0,
    broken: 0,
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 1. LOAD DATA (Giữ nguyên logic cũ) ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Lấy thống kê
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
        // Vẫn set loading = false để hiển thị trang ngay cả khi API lỗi
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);



  const handleQuickAction = (key) => {
    switch (key) {
      case 'add-device':
        // TODO: Navigate to add device page
        break;
      case 'school-inventory':
        navigate('/lab-manager/school-devices');
        break;
      case 'record':
        navigate('/lab-manager/borrow-return');
        break;
      case 'search':
        navigate('/lab-manager/devices');
        break;
      case 'export':
        // TODO: Export report
        break;
      default:
        break;
    }
  };


  const quickActions = [
    {
      title: 'Yêu cầu thêm thiết bị',
      icon: <PlusOutlined />,
      color: '#1890ff',
      key: 'add-device',
    },
    {
      title: 'Kho School',
      icon: <AppstoreOutlined />, 
      color: '#13c2c2',
      key: 'school-inventory',
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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <LabManagerSidebar />

      <Layout style={{ marginLeft: 240 }}>
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