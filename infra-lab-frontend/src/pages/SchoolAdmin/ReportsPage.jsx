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
  Space,
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

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2'];

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

      // Gọi API phù hợp với role
      // Lưu ý: baseURL đã có /api rồi, nên không cần thêm /api ở đây
      const apiEndpoint = role === 'lab_manager' 
        ? `/dashboard/lab/reports?period=${period}`
        : `/school-dashboard/reports?period=${period}`;
      
      console.log('Fetching reports from:', apiEndpoint, 'for role:', role);
      const response = await api.get(apiEndpoint);
      console.log('Reports API response:', response);
      
      // Axios interceptor đã trả về response.data, nên response ở đây đã là data rồi
      // Kiểm tra các trường hợp có thể xảy ra
      let dataToSet = null;
      
      if (response && response.success && response.data) {
        // Trường hợp 1: { success: true, data: {...} }
        dataToSet = response.data;
        console.log('Setting reports data (with success field):', dataToSet);
      } else if (response && response.data && !response.success) {
        // Trường hợp 2: { data: {...} } (không có success)
        dataToSet = response.data;
        console.log('Setting reports data (data field only):', dataToSet);
      } else if (response && !response.data && !response.success) {
        // Trường hợp 3: response chính là data object
        dataToSet = response;
        console.log('Setting reports data (direct object):', dataToSet);
      } else {
        console.warn('Empty or invalid response:', response);
        dataToSet = null;
      }
      
      setReportsData(dataToSet);
      
      // Log để debug
      if (dataToSet) {
        console.log('Reports data structure:', {
          hasDeviceStatusData: !!dataToSet.deviceStatusData,
          hasBorrowRequests: !!dataToSet.borrowRequestsByMonth,
          hasRepairRequests: !!dataToSet.repairRequestsByMonth,
          deviceStatusData: dataToSet.deviceStatusData,
        });
      }
    } catch (error) {
      console.error('Error fetching reports data:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      // Hiển thị thông báo lỗi cho user
      setReportsData(null);
    } finally {
      setLoading(false);
    }
  };

  // Chuẩn bị dữ liệu cho biểu đồ tròn - Trạng thái thiết bị
  const deviceStatusChartData = reportsData?.deviceStatusData
    ? [
        { name: 'Sẵn sàng', value: reportsData.deviceStatusData.available || 0, color: '#52c41a' },
        { name: 'Đang mượn', value: reportsData.deviceStatusData.borrowed || 0, color: '#1890ff' },
        { name: 'Đang sửa', value: reportsData.deviceStatusData.inRepair || 0, color: '#faad14' },
        { name: 'Hỏng', value: reportsData.deviceStatusData.broken || 0, color: '#ff4d4f' },
      ].filter(item => item.value > 0)
    : [];

  // Chuẩn bị dữ liệu cho biểu đồ cột - Yêu cầu mượn theo tháng
  const borrowRequestsData = reportsData?.borrowRequestsByMonth || [];

  // Chuẩn bị dữ liệu cho biểu đồ đường - Yêu cầu sửa chữa theo tháng
  const repairRequestsData = reportsData?.repairRequestsByMonth || [];

  // Chuẩn bị dữ liệu cho biểu đồ thanh - Top thiết bị được mượn nhiều nhất
  const topBorrowedDevicesData = reportsData?.topBorrowedDevices?.slice(0, 10).map((item, index) => ({
    name: item.deviceName?.length > 20 ? item.deviceName.substring(0, 20) + '...' : item.deviceName,
    fullName: item.deviceName,
    quantity: item.totalQuantity,
    count: item.borrowCount,
  })) || [];

  // Chuẩn bị dữ liệu cho biểu đồ tròn - Trạng thái yêu cầu mượn
  const borrowStatusChartData = reportsData?.borrowStatusStats
    ? [
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
        { name: 'Chờ duyệt', value: reportsData.repairStatusStats.pending, color: '#faad14' },
        { name: 'Đã duyệt', value: reportsData.repairStatusStats.approved, color: '#1890ff' },
        { name: 'Đang sửa', value: reportsData.repairStatusStats.inProgress, color: '#722ed1' },
        { name: 'Hoàn thành', value: reportsData.repairStatusStats.completed, color: '#52c41a' },
        { name: 'Từ chối', value: reportsData.repairStatusStats.rejected, color: '#ff4d4f' },
      ].filter(item => item.value > 0)
    : [];

  // Chuẩn bị dữ liệu cho biểu đồ thanh - Sử dụng theo danh mục
  const categoryUsageData = reportsData?.categoryUsage?.slice(0, 8).map(item => ({
    name: item.categoryName?.length > 15 ? item.categoryName.substring(0, 15) + '...' : item.categoryName,
    fullName: item.categoryName,
    total: item.total,
    available: item.available,
    broken: item.broken,
    usageRate: Math.round(item.usageRate || 0),
  })) || [];

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
            <Spin size="large" tip="Đang tải dữ liệu báo cáo..." />
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
            Báo Cáo & Thống Kê
          </Title>
          <Select
            value={period}
            onChange={setPeriod}
            style={{ width: 150 }}
          >
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
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="Sinh viên đang mượn"
                      value={reportsData?.studentStats?.studentsCurrentlyBorrowing || 0}
                      prefix={<UserOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="Đơn mượn quá hạn"
                      value={reportsData?.studentStats?.overdueBorrows || 0}
                      prefix={<ExclamationCircleOutlined />}
                      valueStyle={{ color: '#ff4d4f' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="Sinh viên chờ duyệt"
                      value={reportsData?.studentStats?.pendingStudents || 0}
                      prefix={<ClockCircleOutlined />}
                      valueStyle={{ color: '#faad14' }}
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
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="Thiết bị sẵn sàng"
                      value={reportsData?.deviceStatusData?.available || 0}
                      prefix={<CheckCircleOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="Đang sửa chữa"
                      value={reportsData?.deviceStatusData?.inRepair || 0}
                      prefix={<WarningOutlined />}
                      valueStyle={{ color: '#faad14' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="Thiết bị hỏng"
                      value={reportsData?.deviceStatusData?.broken || 0}
                      prefix={<WarningOutlined />}
                      valueStyle={{ color: '#ff4d4f' }}
                    />
                  </Card>
                </Col>
              </>
            )}
          </Row>

          {/* Biểu đồ tròn - Trạng thái thiết bị */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={12}>
              <Card title="Phân bổ trạng thái thiết bị" style={{ height: '100%' }}>
                {deviceStatusChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={deviceStatusChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {deviceStatusChartData.map((entry, index) => (
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

          {/* Biểu đồ thanh - Top thiết bị được mượn nhiều nhất */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={12}>
              <Card title="Top 10 thiết bị được mượn nhiều nhất">
                {topBorrowedDevicesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={topBorrowedDevicesData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={90} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div style={{
                                backgroundColor: '#fff',
                                padding: '10px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                              }}>
                                <p style={{ margin: 0, fontWeight: 'bold' }}>{data.fullName}</p>
                                <p style={{ margin: '5px 0 0 0' }}>Số lượng: {data.quantity}</p>
                                <p style={{ margin: '5px 0 0 0' }}>Số lần mượn: {data.count}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="quantity" fill="#52c41a" name="Tổng số lượng mượn" />
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
              <Card title="Sử dụng thiết bị theo danh mục">
                {categoryUsageData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={categoryUsageData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div style={{
                                backgroundColor: '#fff',
                                padding: '10px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                              }}>
                                <p style={{ margin: 0, fontWeight: 'bold' }}>{data.fullName}</p>
                                <p style={{ margin: '5px 0 0 0' }}>Tổng: {data.total}</p>
                                <p style={{ margin: '5px 0 0 0' }}>Sẵn sàng: {data.available}</p>
                                <p style={{ margin: '5px 0 0 0' }}>Hỏng: {data.broken}</p>
                                <p style={{ margin: '5px 0 0 0' }}>Tỷ lệ sử dụng: {data.usageRate}%</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="total" fill="#1890ff" name="Tổng số" />
                      <Bar dataKey="available" fill="#52c41a" name="Sẵn sàng" />
                      <Bar dataKey="broken" fill="#ff4d4f" name="Hỏng" />
                    </BarChart>
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

