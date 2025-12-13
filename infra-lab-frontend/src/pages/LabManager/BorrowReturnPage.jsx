import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Card,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Avatar,
  Descriptions,
  Modal,
  InputNumber,
  Input,
  message,
  Empty,
  Spin,
  Row,
  Col,
  Divider,
  Menu,
  Select,
  DatePicker,
} from 'antd';
import {
  CheckOutlined,
  UserOutlined,
  ShoppingOutlined,
  CalendarOutlined,
  DashboardOutlined,
  ToolOutlined,
  FileTextOutlined,
  BellOutlined,
  LogoutOutlined,
  ShoppingCartOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Header: LayoutHeader, Sider, Content } = Layout;
const { Title, Text } = Typography;

const BorrowReturnPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [borrowRequests, setBorrowRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [requestReturnModalVisible, setRequestReturnModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedBorrowId, setSelectedBorrowId] = useState(null);
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [brokenQuantity, setBrokenQuantity] = useState(0);
  const [brokenReason, setBrokenReason] = useState('');
  const [isRepairedItem, setIsRepairedItem] = useState(false); // Flag để phân biệt thiết bị đã sửa
  const [selectedMenu, setSelectedMenu] = useState('borrow');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedBorrowRequest, setSelectedBorrowRequest] = useState(null);
  const [filteredInfo, setFilteredInfo] = useState({});
  const [sortedInfo, setSortedInfo] = useState({});

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      const userData = JSON.parse(userString);
      setUser(userData);
    }
    fetchBorrowingStudents();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleMenuClick = ({ key }) => {
    setSelectedMenu(key);
    switch (key) {
      case 'dashboard':
        navigate('/teacher-dashboard');
        break;
      case 'devices':
        navigate('/lab-manager/devices');
        break;
      case 'borrow':
        // Đã ở trang này rồi
        break;
      case 'reports':
        // Navigate to reports page
        break;
      case 'notifications':
        // Navigate to notifications page
        break;
      default:
        break;
    }
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
      icon: <ShoppingCartOutlined />,
      label: 'Danh sách thiết bị mượn',
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

  const fetchBorrowingStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/lab-manager/borrow-return/students');
      
      if (response.success) {
        setBorrowRequests(response.data || []);
      } else {
        message.error('Không thể tải danh sách yêu cầu mượn');
      }
    } catch (error) {
      console.error('Error fetching borrowing requests:', error);
      message.error('Lỗi khi tải danh sách yêu cầu mượn');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReturn = (borrowId) => {
    setSelectedBorrowId(borrowId);
    setRequestReturnModalVisible(true);
  };

  const handleReturnFromRequest = (borrowRequest) => {
    // Nếu chỉ có 1 thiết bị, mở modal trả luôn
    if (borrowRequest.items.length === 1) {
      handleReturn(borrowRequest.items[0], borrowRequest);
    } else {
      // Nếu có nhiều thiết bị, mở modal chi tiết
      handleViewDetail(borrowRequest);
    }
  };

  const handleConfirmRequestReturn = async () => {
    if (!selectedBorrowId) return;

    try {
      const response = await api.post('/lab-manager/borrow-return/request', {
        borrowId: selectedBorrowId,
      });

      if (response.success) {
        message.success('Đã gửi yêu cầu trả thiết bị quá hạn cho sinh viên!');
        setRequestReturnModalVisible(false);
        setSelectedBorrowId(null);
        fetchBorrowingStudents(); // Refresh danh sách
      } else {
        message.error(response.message || 'Lỗi khi yêu cầu trả thiết bị');
      }
    } catch (error) {
      console.error('Error requesting return:', error);
      message.error(error.message || 'Lỗi khi yêu cầu trả thiết bị');
    }
  };

  const handleViewDetail = (borrowRequest) => {
    setSelectedBorrowRequest(borrowRequest);
    setDetailModalVisible(true);
  };

  const handleReturn = (item, borrowRequest) => {
    // Kiểm tra nếu quá hạn và chưa yêu cầu trả
    if (borrowRequest.isOverdue && !borrowRequest.returnRequested) {
      message.warning('Thiết bị quá hạn. Vui lòng yêu cầu trả trước khi ghi nhận trả.');
      return;
    }
    
    setSelectedRecord({
      ...item,
      borrowId: borrowRequest.borrowId,
      returnDueDate: borrowRequest.returnDueDate,
      isOverdue: borrowRequest.isOverdue,
      returnRequested: borrowRequest.returnRequested,
    });
    setReturnQuantity(1);
    setBrokenQuantity(0);
    setBrokenReason('');
    setIsRepairedItem(false); // Đánh dấu là thiết bị chưa trả (không phải đã sửa)
    setReturnModalVisible(true);
  };

  const handleConfirmReturn = async () => {
    if (!selectedRecord) return;

    // Nếu là thiết bị đã sửa, gọi API recordRepairedReturn
    if (isRepairedItem) {
      try {
        const response = await api.post('/lab-manager/borrow-return/repaired', {
          borrowId: selectedRecord.borrowId,
          deviceId: selectedRecord.device._id,
          quantity: returnQuantity,
        });

        if (response.success) {
          message.success(`Ghi nhận trả ${returnQuantity} thiết bị đã sửa chữa thành công!`);
          setReturnModalVisible(false);
          setSelectedRecord(null);
          setReturnQuantity(1);
          setIsRepairedItem(false);
          fetchBorrowingStudents(); // Refresh danh sách
        } else {
          message.error(response.message || 'Lỗi khi ghi nhận trả thiết bị đã sửa');
        }
      } catch (error) {
        console.error('Error recording repaired return:', error);
        message.error(error.message || 'Lỗi khi ghi nhận trả thiết bị đã sửa');
      }
      return;
    }

    // Logic cho thiết bị chưa trả (có thể có thiết bị hỏng)
    // Kiểm tra số lượng hỏng không được vượt quá số lượng trả
    if (brokenQuantity > returnQuantity) {
      message.error('Số lượng hỏng không được vượt quá số lượng trả');
      return;
    }

    // Nếu có thiết bị hỏng nhưng chưa nhập lý do
    if (brokenQuantity > 0 && !brokenReason.trim()) {
      message.warning('Vui lòng nhập lý do thiết bị bị hỏng');
      return;
    }

    try {
      const response = await api.post('/lab-manager/borrow-return/return', {
        borrowId: selectedRecord.borrowId,
        deviceId: selectedRecord.device._id,
        quantity: returnQuantity,
        brokenQuantity: brokenQuantity || 0,
        brokenReason: brokenReason || undefined,
      });

      if (response.success) {
        if (brokenQuantity > 0) {
          message.success(`Ghi nhận trả thiết bị thành công! Đã nhận ${returnQuantity - brokenQuantity} thiết bị tốt. ${brokenQuantity} thiết bị hỏng cần sinh viên tự sửa chữa và trả lại.`);
        } else {
          message.success('Ghi nhận trả thiết bị thành công!');
        }
        setReturnModalVisible(false);
        setSelectedRecord(null);
        setBrokenQuantity(0);
        setBrokenReason('');
        setIsRepairedItem(false);
        fetchBorrowingStudents(); // Refresh danh sách
      } else {
        message.error(response.message || 'Lỗi khi ghi nhận trả thiết bị');
      }
    } catch (error) {
      console.error('Error recording return:', error);
      message.error(error.message || 'Lỗi khi ghi nhận trả thiết bị');
    }
  };

  const getStatusTag = (status, isOverdue, returnRequested) => {
    if (isOverdue && !returnRequested) {
      return <Tag color="red" icon={<WarningOutlined />}>Quá hạn - Chưa yêu cầu trả</Tag>;
    }
    if (isOverdue && returnRequested) {
      return <Tag color="orange" icon={<ExclamationCircleOutlined />}>Quá hạn - Đã yêu cầu trả</Tag>;
    }
    
    const statusMap = {
      borrowed: { color: 'blue', text: 'Đang mượn' },
      return_pending: { color: 'orange', text: 'Chờ trả' },
      return_requested: { color: 'orange', text: 'Đã yêu cầu trả' },
      returned: { color: 'green', text: 'Đã trả xong' },
    };
    const statusInfo = statusMap[status] || { color: 'default', text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleTableChange = (pagination, filters, sorter) => {
    setFilteredInfo(filters);
    setSortedInfo(sorter);
  };

  const clearFilters = () => {
    setFilteredInfo({});
    setSortedInfo({});
  };

  const { Option } = Select;
  const { RangePicker } = DatePicker;

  const columns = [
    {
      title: 'Mã yêu cầu',
      dataIndex: 'borrowIdString',
      key: 'borrowId',
      width: 200,
      filteredValue: filteredInfo.borrowIdString || null,
      onFilter: (value, record) => {
        const last8 = record.borrowIdString.slice(-8).toLowerCase();
        return last8.includes(value.toLowerCase());
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Tìm mã yêu cầu (8 ký tự cuối)"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 200, marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              size="small"
              style={{ width: 90 }}
            >
              Tìm
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              Reset
            </Button>
          </Space>
        </div>
      ),
      render: (_, record) => (
        <Text code style={{ fontSize: 12 }}>
          {record.borrowIdString.slice(-8)}
        </Text>
      ),
    },
    {
      title: 'Tổng thiết bị',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      align: 'center',
      width: 150,
      sorter: (a, b) => a.totalQuantity - b.totalQuantity,
      sortOrder: sortedInfo.columnKey === 'totalQuantity' ? sortedInfo.order : null,
      filteredValue: filteredInfo.totalQuantity || null,
      onFilter: (value, record) => {
        if (value === 'all') return true;
        if (value === '1') return record.totalQuantity === 1;
        if (value === '2-5') return record.totalQuantity >= 2 && record.totalQuantity <= 5;
        if (value === '6-10') return record.totalQuantity >= 6 && record.totalQuantity <= 10;
        if (value === '10+') return record.totalQuantity > 10;
        return true;
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Select
            style={{ width: 150, marginBottom: 8, display: 'block' }}
            placeholder="Chọn khoảng"
            value={selectedKeys[0]}
            onChange={(value) => {
              setSelectedKeys(value ? [value] : []);
              confirm();
            }}
            allowClear
          >
            <Option value="all">Tất cả</Option>
            <Option value="1">1 thiết bị</Option>
            <Option value="2-5">2-5 thiết bị</Option>
            <Option value="6-10">6-10 thiết bị</Option>
            <Option value="10+">Trên 10 thiết bị</Option>
          </Select>
          <Button
            onClick={() => {
              clearFilters();
              confirm();
            }}
            size="small"
            style={{ width: '100%' }}
          >
            Reset
          </Button>
        </div>
      ),
      render: (_, record) => (
        <Text strong>{record.totalQuantity} thiết bị</Text>
      ),
    },
    {
      title: 'Ngày hẹn trả',
      dataIndex: 'returnDueDate',
      key: 'returnDueDate',
      width: 200,
      sorter: (a, b) => new Date(a.returnDueDate) - new Date(b.returnDueDate),
      sortOrder: sortedInfo.columnKey === 'returnDueDate' ? sortedInfo.order : null,
      filteredValue: filteredInfo.returnDueDate || null,
      onFilter: (value, record) => {
        if (!value || !Array.isArray(value) || value.length === 0) return true;
        const recordDate = dayjs(record.returnDueDate);
        const dates = value[0];
        if (!dates || !Array.isArray(dates) || dates.length === 0) return true;
        const startDate = dates[0] ? dayjs(dates[0]) : null;
        const endDate = dates[1] ? dayjs(dates[1]) : null;
        if (startDate && endDate) {
          return recordDate.isAfter(startDate.subtract(1, 'day')) && recordDate.isBefore(endDate.add(1, 'day'));
        }
        if (startDate) {
          return recordDate.isAfter(startDate.subtract(1, 'day'));
        }
        if (endDate) {
          return recordDate.isBefore(endDate.add(1, 'day'));
        }
        return true;
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <RangePicker
            style={{ width: 250, marginBottom: 8, display: 'block' }}
            value={selectedKeys[0] && Array.isArray(selectedKeys[0]) ? [dayjs(selectedKeys[0][0]), dayjs(selectedKeys[0][1])] : null}
            onChange={(dates) => {
              setSelectedKeys(dates ? [dates] : []);
            }}
            format="DD/MM/YYYY"
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              size="small"
              style={{ width: 90 }}
            >
              Tìm
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              Reset
            </Button>
          </Space>
        </div>
      ),
      render: (_, record) => (
        <Space>
          <CalendarOutlined />
          <Text>{formatDate(record.returnDueDate)}</Text>
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 220,
      filteredValue: filteredInfo.status || null,
      onFilter: (value, record) => {
        if (value === 'all') return true;
        if (value === 'overdue') return record.isOverdue && !record.returnRequested;
        if (value === 'overdue_requested') return record.isOverdue && record.returnRequested;
        return record.status === value;
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Select
            style={{ width: 200, marginBottom: 8, display: 'block' }}
            placeholder="Chọn trạng thái"
            value={selectedKeys[0]}
            onChange={(value) => {
              setSelectedKeys(value ? [value] : []);
              confirm();
            }}
            allowClear
          >
            <Option value="all">Tất cả</Option>
            <Option value="borrowed">Đang mượn</Option>
            <Option value="return_pending">Chờ trả</Option>
            <Option value="return_requested">Đã yêu cầu trả</Option>
            <Option value="overdue">Quá hạn - Chưa yêu cầu trả</Option>
            <Option value="overdue_requested">Quá hạn - Đã yêu cầu trả</Option>
            <Option value="returned">Đã trả xong</Option>
          </Select>
          <Button
            onClick={() => {
              clearFilters();
              confirm();
            }}
            size="small"
            style={{ width: '100%' }}
          >
            Reset
          </Button>
        </div>
      ),
      render: (_, record) => getStatusTag(record.status, record.isOverdue, record.returnRequested),
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'center',
      width: 280,
      render: (_, record) => (
        <Space>
          <Button
            type="default"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            Xem chi tiết
          </Button>
          {record.isOverdue && !record.returnRequested ? (
            <Button
              type="primary"
              danger
              icon={<ExclamationCircleOutlined />}
              onClick={() => handleRequestReturn(record.borrowId)}
            >
              Yêu cầu trả
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => handleReturnFromRequest(record)}
            >
              Ghi nhận trả
            </Button>
          )}
        </Space>
      ),
    },
  ];

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
            Đăng xuất
          </Button>
        </div>
      </Sider>

      <Layout style={{ marginLeft: 250 }}>
        <Content style={{ margin: '24px', minHeight: 280 }}>
          <Card>
            <Spin spinning={loading}>
              {borrowRequests.length === 0 ? (
                <Empty
                  description="Chưa có yêu cầu mượn nào"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <>
                  {Object.keys(filteredInfo).length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <Button onClick={clearFilters} size="small">
                        Xóa bộ lọc
                      </Button>
                    </div>
                  )}
                  <Table
                    columns={columns}
                    dataSource={borrowRequests}
                    rowKey={(record) => record.borrowIdString}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `Tổng ${total} yêu cầu`,
                    }}
                    size="middle"
                    onChange={handleTableChange}
                  />
                </>
              )}
            </Spin>
          </Card>

        {/* Modal xem chi tiết yêu cầu mượn */}
        <Modal
          title={
            <Space>
              <FileTextOutlined />
              <span>Chi tiết yêu cầu mượn</span>
            </Space>
          }
          open={detailModalVisible}
          onCancel={() => {
            setDetailModalVisible(false);
            setSelectedBorrowRequest(null);
          }}
          footer={[
            <Button key="close" onClick={() => {
              setDetailModalVisible(false);
              setSelectedBorrowRequest(null);
            }}>
              Đóng
            </Button>,
          ]}
          width={900}
        >
          {selectedBorrowRequest && (
            <div>
              {/* Thông tin sinh viên */}
              <Divider orientation="left">
                <Space>
                  <UserOutlined />
                  <Text strong>Thông tin sinh viên</Text>
                </Space>
              </Divider>
              <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="Họ và tên">
                  <Space>
                    <Avatar
                      icon={<UserOutlined />}
                      style={{ backgroundColor: '#1890ff' }}
                    >
                      {selectedBorrowRequest.student.name?.charAt(0) || 'S'}
                    </Avatar>
                    <Text strong>{selectedBorrowRequest.student.name || 'N/A'}</Text>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {selectedBorrowRequest.student.email || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Mã sinh viên">
                  {selectedBorrowRequest.student.student_code || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">
                  {selectedBorrowRequest.student.phone || 'N/A'}
                </Descriptions.Item>
              </Descriptions>

              {/* Thông tin yêu cầu mượn */}
              <Divider orientation="left">
                <Space>
                  <FileTextOutlined />
                  <Text strong>Thông tin yêu cầu mượn</Text>
                </Space>
              </Divider>
              <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="Mã yêu cầu">
                  <Text code>{selectedBorrowRequest.borrowIdString}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày hẹn trả">
                  <Space>
                    <CalendarOutlined />
                    <Text>{formatDate(selectedBorrowRequest.returnDueDate)}</Text>
                    {selectedBorrowRequest.isOverdue && (
                      <Tag color="red">Quá hạn</Tag>
                    )}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Mục đích sử dụng">
                  {selectedBorrowRequest.purpose || 'N/A'}
                </Descriptions.Item>
                {selectedBorrowRequest.notes && (
                  <Descriptions.Item label="Ghi chú">
                    {selectedBorrowRequest.notes}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Trạng thái">
                  {getStatusTag(selectedBorrowRequest.status, selectedBorrowRequest.isOverdue, selectedBorrowRequest.returnRequested)}
                </Descriptions.Item>
              </Descriptions>

              {/* Danh sách thiết bị tốt chưa trả */}
              {selectedBorrowRequest.items && selectedBorrowRequest.items.length > 0 && (
                <>
                  <Divider orientation="left">
                    <Space>
                      <ShoppingOutlined />
                      <Text strong>Danh sách thiết bị chưa trả ({selectedBorrowRequest.items.length})</Text>
                    </Space>
                  </Divider>

                  <Table
                    columns={[
                      {
                        title: 'Thiết bị',
                        key: 'device',
                        render: (_, item) => (
                          <Space>
                            <Avatar
                              src={item.device.image}
                              icon={<ShoppingOutlined />}
                              shape="square"
                              size={40}
                            />
                            <div>
                              <Text strong>{item.device.name}</Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {item.device.category || 'N/A'}
                              </Text>
                            </div>
                          </Space>
                        ),
                      },
                      {
                        title: 'Số lượng',
                        key: 'quantity',
                        align: 'center',
                        render: (_, item) => <Text strong>{item.quantity}</Text>,
                      },
                      {
                        title: 'Hành động',
                        key: 'action',
                        align: 'center',
                        render: (_, item) => {
                          // Kiểm tra nếu quá hạn và chưa yêu cầu trả
                          if (selectedBorrowRequest.isOverdue && !selectedBorrowRequest.returnRequested) {
                            return (
                              <Button
                                type="primary"
                                danger
                                icon={<ExclamationCircleOutlined />}
                                onClick={() => {
                                  setDetailModalVisible(false);
                                  handleRequestReturn(selectedBorrowRequest.borrowId);
                                }}
                              >
                                Yêu cầu trả
                              </Button>
                            );
                          }
                          return (
                            <Button
                              type="primary"
                              icon={<CheckOutlined />}
                              onClick={() => {
                                setDetailModalVisible(false);
                                handleReturn(item, selectedBorrowRequest);
                              }}
                            >
                              Ghi nhận trả
                            </Button>
                          );
                        },
                      },
                    ]}
                    dataSource={selectedBorrowRequest.items}
                    rowKey={(item) => item.device._id}
                    pagination={false}
                    size="small"
                    style={{ marginBottom: 24 }}
                  />
                </>
              )}

              {/* Danh sách thiết bị hỏng đang sửa chữa */}
              {selectedBorrowRequest.repairingItems && selectedBorrowRequest.repairingItems.length > 0 && (
                <>
                  <Divider orientation="left">
                    <Space>
                      <WarningOutlined style={{ color: '#faad14' }} />
                      <Text strong>Thiết bị hỏng đang sửa chữa ({selectedBorrowRequest.repairingItems.length})</Text>
                    </Space>
                  </Divider>

                  <Table
                    columns={[
                      {
                        title: 'Thiết bị',
                        key: 'device',
                        render: (_, item) => (
                          <Space>
                            <Avatar
                              src={item.device.image}
                              icon={<ShoppingOutlined />}
                              shape="square"
                              size={40}
                            />
                            <div>
                              <Text strong>{item.device.name}</Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {item.device.category || 'N/A'}
                              </Text>
                            </div>
                          </Space>
                        ),
                      },
                      {
                        title: 'Số lượng',
                        key: 'quantity',
                        align: 'center',
                        render: (_, item) => <Text strong>{item.quantity}</Text>,
                      },
                      {
                        title: 'Lý do hỏng',
                        key: 'broken_reason',
                        render: (_, item) => (
                          <Text type="secondary">{item.broken_reason || 'N/A'}</Text>
                        ),
                      },
                      {
                        title: 'Hành động',
                        key: 'action',
                        align: 'center',
                        render: (_, item) => (
                          <Button
                            type="primary"
                            icon={<CheckOutlined />}
                            onClick={() => {
                              setDetailModalVisible(false);
                              // Ghi nhận trả thiết bị đã sửa
                              setSelectedRecord({ ...item, borrowId: selectedBorrowRequest.borrowId });
                              setReturnQuantity(item.quantity);
                              setBrokenQuantity(0); // Thiết bị đã sửa nên không hỏng
                              setBrokenReason('');
                              setIsRepairedItem(true); // Đánh dấu là thiết bị đã sửa
                              setReturnModalVisible(true);
                            }}
                          >
                            Ghi nhận trả (đã sửa)
                          </Button>
                        ),
                      },
                    ]}
                    dataSource={selectedBorrowRequest.repairingItems}
                    rowKey={(item) => item.device._id}
                    pagination={false}
                    size="small"
                  />
                </>
              )}

              {/* Hiển thị thông báo nếu không có thiết bị nào */}
              {(!selectedBorrowRequest.items || selectedBorrowRequest.items.length === 0) &&
               (!selectedBorrowRequest.repairingItems || selectedBorrowRequest.repairingItems.length === 0) && (
                <Empty
                  description="Không còn thiết bị nào đang mượn"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </div>
          )}
        </Modal>

        {/* Modal yêu cầu trả thiết bị quá hạn */}
        <Modal
          title="Yêu cầu trả thiết bị quá hạn"
          open={requestReturnModalVisible}
          onOk={handleConfirmRequestReturn}
          onCancel={() => {
            setRequestReturnModalVisible(false);
            setSelectedBorrowId(null);
          }}
          okText="Xác nhận"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <div>
            <p>Bạn có chắc chắn muốn yêu cầu sinh viên trả lại thiết bị quá hạn không?</p>
            <p style={{ color: '#faad14', marginTop: 8 }}>
              <WarningOutlined /> Sinh viên sẽ nhận được thông báo yêu cầu trả thiết bị.
            </p>
          </div>
        </Modal>

        {/* Modal xác nhận trả thiết bị */}
        <Modal
          title={isRepairedItem ? "Ghi nhận trả thiết bị đã sửa chữa" : "Ghi nhận trả thiết bị"}
          open={returnModalVisible}
          onOk={handleConfirmReturn}
          onCancel={() => {
            setReturnModalVisible(false);
            setSelectedRecord(null);
            setBrokenQuantity(0);
            setBrokenReason('');
            setIsRepairedItem(false);
          }}
          okText="Xác nhận"
          cancelText="Hủy"
        >
          {selectedRecord && (
            <div>
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Thiết bị">
                  {selectedRecord.device.name}
                </Descriptions.Item>
                <Descriptions.Item label="Số lượng đang mượn">
                  {selectedRecord.quantity}
                </Descriptions.Item>
                <Descriptions.Item label="Số lượng trả">
                  <InputNumber
                    min={1}
                    max={selectedRecord.quantity}
                    value={returnQuantity}
                    onChange={setReturnQuantity}
                    style={{ width: '100%' }}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="Ngày hẹn trả">
                  {formatDate(selectedRecord.returnDueDate)}
                  {selectedRecord.isOverdue && (
                    <Tag color="red" style={{ marginLeft: 8 }}>
                      Quá hạn
                    </Tag>
                  )}
                </Descriptions.Item>
                {selectedRecord.returnRequested && (
                  <Descriptions.Item label="Yêu cầu trả">
                    <Tag color="orange">Đã yêu cầu trả</Tag>
                  </Descriptions.Item>
                )}
              </Descriptions>

              {/* Chỉ hiển thị phần "Thiết bị bị hỏng" khi KHÔNG phải thiết bị đã sửa */}
              {!isRepairedItem && (
                <>
                  <Divider orientation="left" style={{ marginTop: 16, marginBottom: 16 }}>
                    <Space>
                      <CloseCircleOutlined style={{ color: '#f5222d' }} />
                      <Text strong>Thiết bị bị hỏng (nếu có)</Text>
                    </Space>
                  </Divider>

                  <Descriptions column={1} bordered size="small">
                    <Descriptions.Item label="Số lượng thiết bị bị hỏng">
                      <InputNumber
                        min={0}
                        max={returnQuantity}
                        value={brokenQuantity}
                        onChange={(value) => {
                          setBrokenQuantity(value || 0);
                          if (value > 0 && !brokenReason.trim()) {
                            // Tự động focus vào ô lý do nếu có thiết bị hỏng
                          }
                        }}
                        style={{ width: '100%' }}
                        placeholder="Nhập số lượng hỏng (0 nếu không có)"
                      />
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                        Tối đa: {returnQuantity} thiết bị
                      </Text>
                    </Descriptions.Item>
                    {brokenQuantity > 0 && (
                      <Descriptions.Item label="Lý do thiết bị bị hỏng">
                        <Input.TextArea
                          rows={3}
                          value={brokenReason}
                          onChange={(e) => setBrokenReason(e.target.value)}
                          placeholder="Nhập lý do thiết bị bị hỏng (bắt buộc)"
                          showCount
                          maxLength={500}
                        />
                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                          <WarningOutlined /> Vui lòng mô tả chi tiết tình trạng hỏng của thiết bị
                        </Text>
                      </Descriptions.Item>
                    )}
                  </Descriptions>

                  {brokenQuantity > 0 && (
                    <div style={{ 
                      marginTop: 16, 
                      padding: 12, 
                      backgroundColor: '#fff7e6', 
                      border: '1px solid #ffd591',
                      borderRadius: 4
                    }}>
                      <Space>
                        <WarningOutlined style={{ color: '#faad14' }} />
                        <Text style={{ color: '#faad14' }}>
                          Lưu ý: {brokenQuantity} thiết bị bị hỏng sẽ được ghi nhận và tạo yêu cầu sửa chữa.
                        </Text>
                      </Space>
                    </div>
                  )}
                </>
              )}

              {/* Hiển thị thông báo khi là thiết bị đã sửa */}
              {isRepairedItem && (
                <div style={{ 
                  marginTop: 16, 
                  padding: 12, 
                  backgroundColor: '#f6ffed', 
                  border: '1px solid #b7eb8f',
                  borderRadius: 4
                }}>
                  <Space>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    <Text style={{ color: '#52c41a' }}>
                      Thiết bị đã được sinh viên sửa chữa xong và mang đến trả lại.
                    </Text>
                  </Space>
                </div>
              )}
            </div>
          )}
        </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default BorrowReturnPage;

