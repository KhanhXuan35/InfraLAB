import React, { useEffect, useState } from 'react';
import {
  Layout,
  Row,
  Col,
  Card,
  Typography,
  Select,
  Spin,
  Statistic,
} from 'antd';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  ToolOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  UserOutlined,
  TeamOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import api from '../../services/api';
import SchoolAdminSidebar from '../../components/Sidebar/SchoolAdminSidebar';
import LabManagerSidebar from '../../components/Sidebar/LabManagerSidebar';

const { Header: LayoutHeader, Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

const ReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [reportsData, setReportsData] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Lấy role từ localStorage
    const userString = localStorage.getItem('user');
    if (userString) {
      const userData = JSON.parse(userString);
      setUserRole(userData.role);
    }
    fetchReportsData();
  }, [period]);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      // Lấy role từ localStorage
      const userString = localStorage.getItem('user');
      let role = 'school_admin';
      if (userString) {
        const userData = JSON.parse(userString);
        role = userData.role;
      }

      const apiEndpoint = role === 'lab_manager' 
        ? `/dashboard/lab/reports?period=${period}`
        : `/school-dashboard/reports?period=${period}`;
      
      const response = await api.get(apiEndpoint);
      
      let dataToSet = null;
      
      if (response && response.success && response.data) {
        dataToSet = response.data;
      } else if (response && response.data && !response.success) {
        dataToSet = response.data;
      } else if (response && !response.data && !response.success) {
        dataToSet = response;
      }
      
      setReportsData(dataToSet);
    } catch (error) {
      setReportsData(null);
    } finally {
      setLoading(false);
    }
  };

  // Chuẩn bị dữ liệu cho biểu đồ cột nhóm - Trạng thái thiết bị theo Lab và Warehouse
  const deviceStatusDetail = reportsData?.deviceStatusData?.detail;
  const deviceStatusBarChartData = deviceStatusDetail
    ? [
        {
          name: 'Sẵn sàng',
          Lab: deviceStatusDetail.lab?.available || 0,
          Warehouse: deviceStatusDetail.warehouse?.available || 0,
        },
        {
          name: 'Đang mượn',
          Lab: deviceStatusDetail.lab?.borrowed || 0,
          Warehouse: deviceStatusDetail.warehouse?.borrowed || 0,
        },
        {
          name: 'Đang sửa',
          Lab: deviceStatusDetail.lab?.inRepair || 0,
          Warehouse: deviceStatusDetail.warehouse?.inRepair || 0,
        },
        {
          name: 'Hỏng',
          Lab: deviceStatusDetail.lab?.broken || 0,
          Warehouse: deviceStatusDetail.warehouse?.broken || 0,
        },
      ]
    : [];

  // Chuẩn bị dữ liệu cho biểu đồ cột - Yêu cầu mượn theo tháng
  const borrowRequestsData = reportsData?.borrowRequestsByMonth || [];

  // Chuẩn bị dữ liệu cho biểu đồ đường - Yêu cầu sửa chữa theo tháng
  const repairRequestsData = reportsData?.repairRequestsByMonth || [];

  // Chuẩn bị dữ liệu cho biểu đồ tròn - Trạng thái yêu cầu mượn
  const borrowStatusChartData = reportsData?.borrowStatusStats
    ? [ 
      // đổi màu trạng thái yêu cầu mượn
        { name: 'Chờ duyệt', value: reportsData.borrowStatusStats.pending, color: '#faad14' },
        { name: 'Đã duyệt', value: reportsData.borrowStatusStats.approved, color: '#1890ff' },
        { name: 'Đang mượn', value: reportsData.borrowStatusStats.borrowed, color: '#52c41a' },
        { name: 'Đã trả', value: reportsData.borrowStatusStats.returned, color: '#13c2c2' },
        { name: 'Từ chối', value: reportsData.borrowStatusStats.rejected, color: '#ff4d4f' },
      ].filter(item => item.value > 0)
    : [];

  // Chuẩn bị dữ liệu cho biểu đồ tròn - Trạng thái sửa chữa
  const repairStatusChartData = reportsData?.repairStatusStats
    ? [ 
      // đổi màu trạng thái yêu cầu sửa chữa
        { name: 'Chờ duyệt', value: reportsData.repairStatusStats.pending, color: '#faad14' },
        { name: 'Đã duyệt', value: reportsData.repairStatusStats.approved, color: '#1890ff' },
        { name: 'Đang sửa', value: reportsData.repairStatusStats.inProgress, color: '#722ed1' },
        { name: 'Hoàn thành', value: reportsData.repairStatusStats.completed, color: '#52c41a' },
        { name: 'Từ chối', value: reportsData.repairStatusStats.rejected, color: '#ff4d4f' },
      ].filter(item => item.value > 0)
    : [];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: '#fff',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          {payload.map((entry, index) => (
            <p key={index} style={{ margin: 0, color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Xác định sidebar dựa trên role
  const SidebarComponent = userRole === 'lab_manager' ? LabManagerSidebar : SchoolAdminSidebar;
  const sidebarWidth = userRole === 'lab_manager' ? 240 : 260;

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <SidebarComponent />
        <Layout style={{ marginLeft: sidebarWidth }}>
          <Content style={{ margin: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <Spin size="large" tip="Đang tải dữ liệu thống kê..." />
          </Content>
        </Layout>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <SidebarComponent />

      <Layout style={{ marginLeft: sidebarWidth }}>
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
            Thống Kê
          </Title>
          <Select
            value={period}
            onChange={setPeriod}
            style={{ width: 150 }}
          >
            {/*
              // Nếu muốn bật nhanh tuỳ chọn "1 tuần gần nhất", chỉ cần bỏ "//" ở dòng dưới:
              // <Option value="week">1 tuần gần nhất</Option>
            */}
            <Option value="month">6 tháng gần nhất</Option>
            <Option value="quarter">4 quý gần nhất</Option>
            <Option value="year">2 năm gần nhất</Option>
          </Select>
        </LayoutHeader>

        <Content style={{ margin: '24px' }}>
          {/* Thống kê tổng quan */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {userRole === 'lab_manager' ? (
              // Thống kê cho Lab Manager - về Sinh viên
              <>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="Tổng sinh viên"
                      value={reportsData?.studentStats?.totalActiveStudents || 0}
                      prefix={<TeamOutlined />}
                      styles={{ content: { color: '#1890ff' } }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="Sinh viên đang mượn"
                      value={reportsData?.studentStats?.studentsCurrentlyBorrowing || 0}
                      prefix={<UserOutlined />}
                      styles={{ content: { color: '#52c41a' } }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="Đơn mượn quá hạn"
                      value={reportsData?.studentStats?.overdueBorrows || 0}
                      prefix={<ExclamationCircleOutlined />}
                      styles={{ content: { color: '#ff4d4f' } }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="Sinh viên chờ duyệt"
                      value={reportsData?.studentStats?.pendingStudents || 0}
                      prefix={<ClockCircleOutlined />}
                      styles={{ content: { color: '#faad14' } }}
                    />
                  </Card>
                </Col>
              </>
            ) : (
              // Thống kê cho School Admin - về Thiết bị
              <>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="Tổng thiết bị"
                      value={reportsData?.deviceStatusData
                        ? reportsData.deviceStatusData.available +
                          reportsData.deviceStatusData.broken +
                          reportsData.deviceStatusData.inRepair +
                          reportsData.deviceStatusData.borrowed
                        : 0}
                      prefix={<ToolOutlined />}
                      styles={{ content: { color: '#1890ff' } }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="Thiết bị sẵn sàng"
                      value={reportsData?.deviceStatusData?.available || 0}
                      prefix={<CheckCircleOutlined />}
                      styles={{ content: { color: '#52c41a' } }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="Đang sửa chữa"
                      value={reportsData?.deviceStatusData?.inRepair || 0}
                      prefix={<WarningOutlined />}
                      styles={{ content: { color: '#faad14' } }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="Thiết bị hỏng"
                      value={reportsData?.deviceStatusData?.broken || 0}
                      prefix={<WarningOutlined />}
                      styles={{ content: { color: '#ff4d4f' } }}
                    />
                  </Card>
                </Col>
              </>
            )}
          </Row>

          {/* Biểu đồ cột nhóm - Trạng thái thiết bị theo Lab và Warehouse */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={12}>
              <Card 
                title="Phân bổ trạng thái thiết bị (Lab + Warehouse)" 
                style={{ height: '100%' }}
                extra={
                  deviceStatusDetail ? (
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      <span style={{ color: '#1890ff' }}>Lab: {deviceStatusDetail.lab?.total || 0}</span>
                      {' | '}
                      <span style={{ color: '#52c41a' }}>Warehouse: {deviceStatusDetail.warehouse?.total || 0}</span>
                    </div>
                  ) : null
                }
              >
                {deviceStatusBarChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={deviceStatusBarChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const labValue = payload.find(p => p.dataKey === 'Lab')?.value || 0;
                            const warehouseValue = payload.find(p => p.dataKey === 'Warehouse')?.value || 0;
                            const total = labValue + warehouseValue;
                            return (
                              <div style={{
                                backgroundColor: '#fff',
                                padding: '10px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                              }}>
                                <p style={{ margin: 0, fontWeight: 'bold' }}>{payload[0].payload.name}</p>
                                <p style={{ margin: '5px 0 0 0', color: '#1890ff' }}>
                                  Lab: {labValue}
                                </p>
                                <p style={{ margin: '5px 0 0 0', color: '#52c41a' }}>
                                  Warehouse: {warehouseValue}
                                </p>
                                <p style={{ margin: '5px 0 0 0', fontWeight: 'bold', borderTop: '1px solid #eee', paddingTop: '5px' }}>
                                  Tổng: {total}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      // đổi màu Phân bổ trạng thái thiết bị (Lab + Warehouse)
                      <Bar dataKey="Lab" fill="#1890ff" name="Lab" />
                      <Bar dataKey="Warehouse" fill="#52c41a" name="Warehouse" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                    Chưa có dữ liệu
                  </div>
                )}
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="Trạng thái yêu cầu mượn" style={{ height: '100%' }}>
                {borrowStatusChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={borrowStatusChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {borrowStatusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                    Chưa có dữ liệu
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          {/* Biểu đồ cột - Yêu cầu mượn theo tháng */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={12}>
              <Card title="Yêu cầu mượn theo tháng">
                {borrowRequestsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={borrowRequestsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      // đổi màu Yêu cầu mượn theo tháng
                      <Bar dataKey="count" fill="#1890ff" name="Số lượng yêu cầu" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                    Chưa có dữ liệu
                  </div>
                )}
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="Yêu cầu sửa chữa theo tháng">
                {repairRequestsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={repairRequestsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      // đổi màu Yêu cầu sửa chữa theo tháng
                      <Line type="monotone" dataKey="count" stroke="#ff4d4f" name="Số lượng yêu cầu" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                    Chưa có dữ liệu
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          {/* Biểu đồ tròn - Trạng thái sửa chữa */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Trạng thái yêu cầu sửa chữa">
                {repairStatusChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={repairStatusChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {repairStatusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                    Chưa có dữ liệu
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
};

export default ReportsPage;

