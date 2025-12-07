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
  Divider
} from 'antd';
import { 
  SearchOutlined, 
  ShoppingCartOutlined, 
  BellOutlined, 
  HistoryOutlined,
  DesktopOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  BulbOutlined,
  ArrowDownOutlined,
  RightOutlined
} from '@ant-design/icons';
import Header from '../../components/Header/Header';
import WelcomeModal from '../../components/WelcomeModal/WelcomeModal';
import api from '../../services/api';
import { STUDENT_ROUTES } from '../../constants/routes';
import * as S from './StudentHomePage.styles';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const StudentHomePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalBorrowed: 0,
    pendingRequests: 0,
    unreadNotifications: 0,
  });
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <S.LoadingContainer>Đang tải...</S.LoadingContainer>;
  }

  const quickActions = [
    {
      title: 'Tìm kiếm thiết bị',
      icon: <SearchOutlined />,
      color: '#1890ff',
      onClick: () => navigate(STUDENT_ROUTES.DEVICES),
    },
    {
      title: 'Mượn thiết bị',
      icon: <ShoppingCartOutlined />,
      color: '#52c41a',
      onClick: () => navigate(STUDENT_ROUTES.REQUESTS),
    },
    {
      title: 'Lịch sử',
      icon: <HistoryOutlined />,
      color: '#faad14',
      onClick: () => navigate(STUDENT_ROUTES.HISTORY),
    },
    {
      title: 'Thông báo',
      icon: <BellOutlined />,
      color: '#f5222d',
      onClick: () => navigate(STUDENT_ROUTES.NOTIFICATIONS),
    },
  ];

  const processSteps = [
    {
      title: 'Tìm thiết bị',
      icon: <BulbOutlined />,
      desc: 'Tìm kiếm và chọn thiết bị bạn muốn mượn từ danh sách có sẵn',
      color: '#1890ff',
    },
    {
      title: 'Gửi yêu cầu',
      icon: <RocketOutlined />,
      desc: 'Tạo yêu cầu mượn thiết bị và chờ quản lý Lab duyệt',
      color: '#52c41a',
    },
    {
      title: 'Nhận thiết bị',
      icon: <CheckCircleOutlined />,
      desc: 'Nhận thiết bị sau khi yêu cầu được duyệt và hoàn tất thủ tục',
      color: '#faad14',
    },
    {
      title: 'Trả thiết bị',
      icon: <DesktopOutlined />,
      desc: 'Trả thiết bị đúng hạn và hoàn tất quy trình mượn',
      color: '#722ed1',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header />
      <WelcomeModal userName={user?.name} />
      
      <Content>
        {/* Hero Section */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '80px 24px',
          textAlign: 'center',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <Title level={1} style={{ color: 'white', fontSize: 48, marginBottom: 16 }}>
              Chào mừng, {user?.name || 'Sinh viên'}!
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: 18, marginBottom: 32 }}>
              Hệ thống quản lý thiết bị phòng Lab - Mượn và quản lý thiết bị một cách dễ dàng
            </Paragraph>
            <Space size="large">
              <Button 
                type="primary" 
                size="large" 
                onClick={() => navigate(STUDENT_ROUTES.DEVICES)}
                style={{ height: 48, paddingLeft: 32, paddingRight: 32 }}
              >
                Xem thiết bị
              </Button>
              <Button 
                size="large" 
                onClick={() => navigate(STUDENT_ROUTES.REQUESTS)}
                style={{ height: 48, paddingLeft: 32, paddingRight: 32, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
              >
                Tạo yêu cầu
              </Button>
            </Space>
          </div>
          <div style={{ 
            position: 'absolute', 
            bottom: 20, 
            left: '50%', 
            transform: 'translateX(-50%)',
            animation: 'bounce 2s infinite'
          }}>
            <ArrowDownOutlined style={{ fontSize: 24, color: 'rgba(255,255,255,0.8)' }} />
          </div>
        </div>

        {/* Stats Section */}
        <div style={{ padding: '40px 24px', background: '#fff' }}>
          <Row gutter={[24, 24]} justify="center">
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Thiết bị đang mượn"
                  value={stats.totalBorrowed}
                  prefix={<ShoppingCartOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Yêu cầu chờ duyệt"
                  value={stats.pendingRequests}
                  prefix={<BellOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Thông báo chưa đọc"
                  value={stats.unreadNotifications}
                  prefix={<BellOutlined />}
                  valueStyle={{ color: '#f5222d' }}
                />
              </Card>
            </Col>
          </Row>
        </div>

        {/* Quick Actions */}
        <div style={{ padding: '60px 24px', maxWidth: 1200, margin: '0 auto' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 48 }}>
            Tính năng chính
          </Title>
          <Row gutter={[24, 24]}>
            {quickActions.map((action, index) => (
              <Col xs={24} sm={12} md={6} key={index}>
                <Card
                  hoverable
                  onClick={action.onClick}
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                  bodyStyle={{ padding: '32px 24px' }}
                >
                  <div style={{ 
                    fontSize: 48, 
                    color: action.color, 
                    marginBottom: 16 
                  }}>
                    {action.icon}
                  </div>
                  <Title level={4} style={{ marginBottom: 0 }}>
                    {action.title}
                  </Title>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* Process Section */}
        <div style={{ padding: '60px 24px', background: '#fafafa', maxWidth: 1200, margin: '0 auto' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 16 }}>
            Quy trình mượn thiết bị
          </Title>
          <Paragraph style={{ textAlign: 'center', marginBottom: 48, color: '#666' }}>
            Quy trình đơn giản và rõ ràng để mượn thiết bị
          </Paragraph>
          <Row gutter={[24, 24]}>
            {processSteps.map((step, index) => (
              <Col xs={24} sm={12} md={6} key={index}>
                <Card style={{ height: '100%', textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: 40, 
                    color: step.color, 
                    marginBottom: 16 
                  }}>
                    {step.icon}
                  </div>
                  <Title level={4} style={{ marginBottom: 8 }}>
                    {step.title}
                  </Title>
                  <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                    {step.desc}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* CTA Section */}
        <div style={{ 
          padding: '80px 24px', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          textAlign: 'center',
          color: 'white'
        }}>
          <Title level={2} style={{ color: 'white', marginBottom: 16 }}>
            Bạn cần hỗ trợ?
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, marginBottom: 32 }}>
            Liên hệ với quản lý Lab hoặc xem hướng dẫn sử dụng chi tiết
          </Paragraph>
          <Button 
            type="primary" 
            size="large"
            onClick={() => navigate(STUDENT_ROUTES.DEVICES)}
            style={{ height: 48, paddingLeft: 40, paddingRight: 40 }}
          >
            Bắt đầu ngay <RightOutlined />
          </Button>
        </div>
      </Content>
    </Layout>
  );
};

export default StudentHomePage;
