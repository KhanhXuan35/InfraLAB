import React, { useState, useEffect } from 'react';
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
  Tag
} from 'antd';
import {
  ToolOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  BellOutlined,
  PlusOutlined,
  SwapOutlined,
  SearchOutlined,
  ExportOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import * as S from './LabManagerHomePage.styles';

// Chỉ giữ lại Typography, không lấy Layout/Sider nữa
const { Title, Text } = Typography;

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

        // Lấy hoạt động gần đây
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

  // --- 2. HÀNH ĐỘNG NHANH (Giữ nguyên) ---
  const handleQuickAction = (key) => {
    switch (key) {
      case 'add-device':
        // Logic thêm thiết bị (có thể mở modal hoặc navigate)
        break;
      case 'record':
        navigate('/lab-manager/borrow-return');
        break;
      case 'search':
        navigate('/lab-manager/devices');
        break;
      case 'export':
        // Handle export logic
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
      title: 'DS thiết bị mượn',
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

  // --- 3. GIAO DIỆN (Đã bỏ Layout bao ngoài) ---
  return (
    <div className="lab-manager-dashboard">
      {/* Tiêu đề trang */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          Dashboard Quản lý Lab
        </Title>
        <Text type="secondary">Tổng quan tình trạng phòng Lab và thiết bị</Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading} hoverable>
            <Statistic
              title="Tổng tài sản"
              value={stats.totalAssets}
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading} hoverable>
            <Statistic
              title="Đang hoạt động"
              value={stats.active}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading} hoverable>
            <Statistic
              title="Đang sửa chữa"
              value={stats.underRepair}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading} hoverable>
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
                      title={
                        <Text style={{ fontSize: 14 }}>{item.message}</Text>
                      }
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
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Chưa có hoạt động nào"
              />
            )}
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
                    onClick={() => handleQuickAction(action.key)}
                    style={{
                      textAlign: 'center',
                      background: `linear-gradient(135deg, ${action.color}15 0%, ${action.color}05 100%)`,
                      cursor: 'pointer',
                      border: '1px solid #f0f0f0'
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
    </div>
  );
};

export default LabManagerHomePage;