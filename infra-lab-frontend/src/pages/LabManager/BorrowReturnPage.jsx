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
  Select,
  DatePicker,
  Checkbox,
} from 'antd';
import {
  CheckOutlined,
  UserOutlined,
  ShoppingOutlined,
  CalendarOutlined,
  ShoppingCartOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import api from '../../services/api';
import LabManagerSidebar from '../../components/Sidebar/LabManagerSidebar';
import dayjs from 'dayjs';

const { Header: LayoutHeader, Content } = Layout;
const { Title, Text } = Typography;

// CSS cho scrollbar của container mã serial
const serialScrollStyle = `
  .serial-scroll-container {
    max-height: 120px;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 4px 0;
  }

  .serial-scroll-container::-webkit-scrollbar {
    width: 6px;
  }

  .serial-scroll-container::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  .serial-scroll-container::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }

  .serial-scroll-container::-webkit-scrollbar-thumb:hover {
    background: #555;
  }

  .serial-scroll-container {
    scrollbar-width: thin;
    scrollbar-color: #888 #f1f1f1;
  }
`;

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
  const [selectedInstanceIds, setSelectedInstanceIds] = useState([]); // Các instance IDs được chọn để trả
  const [brokenInstanceIds, setBrokenInstanceIds] = useState([]); // Các instance IDs bị hỏng
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
    
    // Khởi tạo: chọn tất cả các instance IDs (mặc định chọn hết)
    const allInstanceIds = (item.device_instances || []).map(inst => {
      return inst._id?.toString() || inst.toString();
    });
    setSelectedInstanceIds(allInstanceIds.slice(0, item.quantity)); // Chọn số lượng đang mượn
    setBrokenInstanceIds([]);
    setReturnQuantity(item.quantity);
    setBrokenQuantity(0);
    setBrokenReason('');
    setReturnModalVisible(true);
  };

  const handleConfirmReturn = async () => {
    if (!selectedRecord) return;

    // Không còn logic "Ghi nhận trả thiết bị đã sửa" nữa vì chỉ School Admin sửa
    // Khi School Admin sửa xong, hệ thống tự động cập nhật

    // returnQuantity phải bằng số lượng instance IDs đã chọn
    // Cập nhật returnQuantity theo selectedInstanceIds.length
    const actualReturnQuantity = selectedInstanceIds.length;
    const actualBrokenQuantity = brokenInstanceIds.length;
    
    // Kiểm tra đã chọn instance IDs
    if (actualReturnQuantity === 0) {
      message.error('Vui lòng chọn ít nhất một mã serial để trả');
      return;
    }

    // Kiểm tra số lượng hỏng không được vượt quá số lượng trả
    if (actualBrokenQuantity > actualReturnQuantity) {
      message.error('Số lượng hỏng không được vượt quá số lượng trả');
      return;
    }
    if (actualReturnQuantity === 0) {
      message.error('Vui lòng chọn ít nhất một mã serial để trả');
      return;
    }

    // Kiểm tra thiết bị hỏng phải là subset của thiết bị đã chọn
    const allBrokenInSelected = brokenInstanceIds.every(id => selectedInstanceIds.includes(id));
    if (!allBrokenInSelected) {
      message.error('Thiết bị hỏng phải nằm trong danh sách thiết bị đã chọn để trả');
      return;
    }
    
    // Nếu có thiết bị hỏng nhưng chưa nhập lý do
    if (actualBrokenQuantity > 0 && !brokenReason.trim()) {
      message.warning('Vui lòng nhập lý do thiết bị bị hỏng');
      return;
    }

    try {
      const response = await api.post('/lab-manager/borrow-return/return', {
        borrowId: selectedRecord.borrowId,
        deviceId: selectedRecord.device._id,
        quantity: actualReturnQuantity, // Sử dụng số lượng thực tế đã chọn
        brokenQuantity: brokenInstanceIds.length || 0, // Số lượng hỏng = số lượng brokenInstanceIds
        brokenReason: brokenReason || undefined,
        instanceIds: selectedInstanceIds, // Gửi danh sách instance IDs đã chọn
        brokenInstanceIds: brokenInstanceIds, // Gửi danh sách instance IDs bị hỏng
      });

      if (response.success) {
        const actualBrokenQty = brokenInstanceIds.length;
        if (actualBrokenQty > 0) {
          const goodQty = actualReturnQuantity - actualBrokenQty;
          message.success(`Ghi nhận trả thiết bị thành công! Đã nhận ${goodQty} thiết bị tốt. ${actualBrokenQty} thiết bị hỏng đã được gửi về trường để sửa chữa.`);
        } else {
          message.success('Ghi nhận trả thiết bị thành công!');
        }
        setReturnModalVisible(false);
        setSelectedRecord(null);
        setSelectedInstanceIds([]);
        setBrokenInstanceIds([]);
        setBrokenQuantity(0);
        setBrokenReason('');
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
        // đổi màu Tổng thiết bị 
        <Text strong style={{ color: '' }}>
          {record.totalQuantity} thiết bị
        </Text>
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
      render: (_, record) => {
        const isOverdue = record.isOverdue; 
        return (
          // đổi màu Ngày hẹn trả
          <Space>
            <CalendarOutlined style={{ color: isOverdue ? '' : undefined }} />
            <Text style={{ color: isOverdue ? '#ff4d4f' : '', fontWeight: 500 }}>
              {formatDate(record.returnDueDate)}
            </Text>
          </Space>
        );
      },
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
              // đổi màu nút "Ghi nhận trả" trong modal chi tiết
              style={{ backgroundColor: '', borderColor: '#52c41a' }}
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
      <style>{serialScrollStyle}</style>
      <LabManagerSidebar />

      <Layout style={{ marginLeft: 240 }}>
        <Content style={{ margin: '24px', minHeight: 280 }}>
          <div style={{ marginBottom: 24 }}>
            <Title level={2} style={{ margin: 0, marginBottom: 8 }}>
              Danh sách thiết bị mượn
            </Title>
            <Text type="secondary">
              Quản lý và ghi nhận mượn/trả thiết bị
            </Text>
          </div>
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
                  // đổi màu Thông tin sinh viên
                  <Text strong style={{ color: '' }}>Thông tin sinh viên</Text>
                </Space>
              </Divider>
              <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item
                  label="Họ và tên"
                  //đổi màu họ và tên
                  labelStyle={{ color: '', fontWeight: 600 }}
                >
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
                <Descriptions.Item
                  label="Email"
                  //đổi màu Email
                  labelStyle={{ color: '', fontWeight: 600 }}
                >
                  {selectedBorrowRequest.student.email || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item
                  label="Mã sinh viên"
                  //đổi màu Mã sinh viên
                  labelStyle={{ color: '', fontWeight: 600 }}
                >
                  {selectedBorrowRequest.student.student_code || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item
                  label="Số điện thoại"
                  //đổi màu Số điện thoại
                  labelStyle={{ color: '', fontWeight: 600 }}
                >
                  {selectedBorrowRequest.student.phone || 'N/A'}
                </Descriptions.Item>
              </Descriptions>

              {/* Thông tin yêu cầu mượn */}
              <Divider orientation="left">
                <Space>
                  <FileTextOutlined />
                  <Text strong style={{ color: '' }}>Thông tin yêu cầu mượn</Text>
                </Space>
              </Divider>
              <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item
                  label="Mã yêu cầu"
                  //đổi màu Mã yêu cầu
                  labelStyle={{ color: '', fontWeight: 600 }}
                >
                  <Text code>{selectedBorrowRequest.borrowIdString}</Text>
                </Descriptions.Item>
                <Descriptions.Item
                  label="Ngày hẹn trả"
                  //đổi màu Ngày hẹn trả
                  labelStyle={{ color: '', fontWeight: 600 }}
                >
                  <Space>
                    <CalendarOutlined />
                    <Text>{formatDate(selectedBorrowRequest.returnDueDate)}</Text>
                    {selectedBorrowRequest.isOverdue && (
                      <Tag color="red">Quá hạn</Tag>
                    )}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item
                  label="Mục đích sử dụng"
                  //đổi màu Mục đích sử dụng
                  labelStyle={{ color: '', fontWeight: 600 }}
                >
                  {selectedBorrowRequest.purpose || 'N/A'}
                </Descriptions.Item>
                {selectedBorrowRequest.notes && (
                  <Descriptions.Item
                    label="Ghi chú"
                    //đổi màu Ghi chú
                    labelStyle={{ color: '', fontWeight: 600 }}
                  >
                    {selectedBorrowRequest.notes}
                  </Descriptions.Item>
                )}
                <Descriptions.Item
                  label="Trạng thái"
                  //đổi màu Trạng thái
                  labelStyle={{ color: '', fontWeight: 600 }}
                >
                  {getStatusTag(selectedBorrowRequest.status, selectedBorrowRequest.isOverdue, selectedBorrowRequest.returnRequested)}
                </Descriptions.Item>
              </Descriptions>

              {/* Danh sách thiết bị tốt chưa trả */}
              {selectedBorrowRequest.items && selectedBorrowRequest.items.length > 0 && (
                <>
                         <Divider orientation="left">
                           <Space>
                             <ShoppingOutlined />
                             <Text strong>
                               Danh sách thiết bị chưa trả (
                               {selectedBorrowRequest.items.reduce((sum, item) => sum + (item.quantity || 0), 0)} thiết bị)
                             </Text>
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
                        title: 'Mã serial',
                        key: 'serial',
                        width: 300,
                        render: (_, item) => {
                          const serialNumbers = item.serialNumbers || [];
                          if (serialNumbers.length === 0) {
                            return <Text type="secondary">Chưa có</Text>;
                          }
                          return (
                            <div
                              className="serial-scroll-container"
                              style={{
                                maxHeight: '120px',
                                overflowY: 'auto',
                                overflowX: 'hidden',
                                padding: '4px 0',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  gap: '4px',
                                }}
                              >
                                {serialNumbers.map((serial, idx) => (
                                  <Text
                                    code
                                    key={idx}
                                    style={{
                                      fontSize: 11,
                                      padding: '2px 6px',
                                      margin: 0,
                                      display: 'inline-block',
                                      wordBreak: 'break-all',
                                      whiteSpace: 'normal',
                                      maxWidth: '100%',
                                    }}
                                    title={serial}
                                  >
                                    {serial}
                                  </Text>
                                ))}
                              </div>
                            </div>
                          );
                        },
                      },
                      {
                        title: 'Số lượng',
                        key: 'quantity',
                        align: 'center',
                        width: 100,
                        render: (_, item) => <Text strong>{item.quantity}</Text>,
                      },
                      {
                        title: 'Hành động',
                        key: 'action',
                        align: 'center',
                        width: 150,
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
                      <Text strong>
                        Thiết bị hỏng đang sửa chữa (
                        {selectedBorrowRequest.repairingItems.reduce((sum, item) => sum + (item.quantity || 0), 0)} thiết bị)
                      </Text>
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
                        title: 'Mã serial',
                        key: 'serial',
                        width: 300,
                        render: (_, item) => {
                          const serialNumbers = item.serialNumbers || [];
                          if (serialNumbers.length === 0) {
                            return <Text type="secondary">Chưa có</Text>;
                          }
                          return (
                            <div
                              className="serial-scroll-container"
                              style={{
                                maxHeight: '120px',
                                overflowY: 'auto',
                                overflowX: 'hidden',
                                padding: '4px 0',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  gap: '4px',
                                }}
                              >
                                {serialNumbers.map((serial, idx) => (
                                  <Text
                                    code
                                    key={idx}
                                    style={{
                                      fontSize: 11,
                                      padding: '2px 6px',
                                      margin: 0,
                                      display: 'inline-block',
                                      wordBreak: 'break-all',
                                      whiteSpace: 'normal',
                                      maxWidth: '100%',
                                    }}
                                    title={serial}
                                  >
                                    {serial}
                                  </Text>
                                ))}
                              </div>
                            </div>
                          );
                        },
                      },
                      {
                        title: 'Số lượng',
                        key: 'quantity',
                        align: 'center',
                        width: 100,
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
                        title: 'Trạng thái',
                        key: 'status',
                        align: 'center',
                        width: 200,
                        render: (_, item) => {
                          const repairStatus = item.repairStatus || 'pending';
                          const statusConfig = {
                            'done': { color: 'success', text: 'Đã sửa xong', icon: <CheckCircleOutlined /> },
                            'in_progress': { color: 'processing', text: 'Đang sửa chữa', icon: <SyncOutlined spin /> },
                            'approved': { color: 'processing', text: 'Đã duyệt, đang sửa', icon: <SyncOutlined spin /> },
                            'rejected': { color: 'error', text: 'Đã từ chối sửa', icon: <CloseCircleOutlined /> },
                            'pending': { color: 'warning', text: 'Đang chờ School Admin sửa chữa', icon: <WarningOutlined /> },
                          };
                          const config = statusConfig[repairStatus] || statusConfig['pending'];
                          return (
                            <Tag color={config.color} icon={config.icon}>
                              {config.text}
                            </Tag>
                          );
                        },
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
          title="Ghi nhận trả thiết bị"
          open={returnModalVisible}
          onOk={handleConfirmReturn}
          onCancel={() => {
            setReturnModalVisible(false);
            setSelectedRecord(null);
            setSelectedInstanceIds([]);
            setBrokenInstanceIds([]);
            setBrokenQuantity(0);
            setBrokenReason('');
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

              {/* Danh sách mã serial để chọn */}
              <Divider orientation="left" style={{ marginTop: 16, marginBottom: 16 }}>
                <Space>
                  <ShoppingCartOutlined />
                  <Text strong>Chọn mã serial để trả</Text>
                </Space>
              </Divider>
              
              <div style={{ marginBottom: 16 }}>
                <Space style={{ marginBottom: 8 }}>
                  <Checkbox
                    checked={selectedInstanceIds.length === (selectedRecord.device_instances || []).length && selectedInstanceIds.length > 0}
                    indeterminate={selectedInstanceIds.length > 0 && selectedInstanceIds.length < (selectedRecord.device_instances || []).length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        // Chọn tất cả
                        const allIds = (selectedRecord.device_instances || []).map(inst => {
                          return inst._id?.toString() || inst.toString();
                        });
                        setSelectedInstanceIds(allIds);
                        setReturnQuantity(allIds.length);
                        // Giữ nguyên brokenInstanceIds (không reset khi chọn tất cả)
                      } else {
                        // Bỏ chọn tất cả
                        setSelectedInstanceIds([]);
                        setReturnQuantity(0);
                        setBrokenInstanceIds([]);
                        setBrokenQuantity(0);
                      }
                    }}
                  >
                    <Text strong>Chọn tất cả ({selectedRecord.device_instances?.length || 0} mã serial)</Text>
                  </Checkbox>
                  <Text type="secondary">
                    Đã chọn: {selectedInstanceIds.length} / {selectedRecord.device_instances?.length || 0}
                  </Text>
                </Space>
                
                <div
                  className="serial-scroll-container"
                  style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    overflowX: 'auto',
                    padding: '8px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    backgroundColor: '#fafafa',
                  }}
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    {(selectedRecord.device_instances || []).map((inst, idx) => {
                      const instId = inst._id?.toString() || inst.toString();
                      const serialNumber = inst.serial_number || instId.slice(-8);
                      const isSelected = selectedInstanceIds.includes(instId);
                      const isBroken = brokenInstanceIds.includes(instId);
                      
                      return (
                        <div
                          key={idx}
                          style={{
                            padding: '8px',
                            border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
                            borderRadius: '4px',
                            backgroundColor: isSelected ? '#e6f7ff' : 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                          onClick={(e) => {
                            // Chỉ xử lý khi click vào div, không xử lý khi click vào checkbox (đã có handler riêng)
                            // Kiểm tra nếu click vào checkbox hoặc phần tử con của checkbox
                            if (e.target.type === 'checkbox' || e.target.closest('.ant-checkbox-wrapper')) {
                              return; // Bỏ qua, để checkbox onChange xử lý
                            }
                            
                            if (isSelected) {
                              // Bỏ chọn
                              setSelectedInstanceIds(prev => {
                                const newList = prev.filter(id => id !== instId);
                                setReturnQuantity(newList.length); // Cập nhật returnQuantity theo số lượng thực tế
                                return newList;
                              });
                              // Nếu đang đánh dấu hỏng, cũng bỏ chọn hỏng
                              if (isBroken) {
                                setBrokenInstanceIds(prev => {
                                  const newBrokenList = prev.filter(id => id !== instId);
                                  setBrokenQuantity(newBrokenList.length); // Cập nhật brokenQuantity theo số lượng thực tế
                                  return newBrokenList;
                                });
                              }
                            } else {
                              // Chọn - kiểm tra xem đã có trong list chưa để tránh duplicate
                              setSelectedInstanceIds(prev => {
                                if (prev.includes(instId)) {
                                  return prev; // Đã có rồi, không thêm nữa
                                }
                                const newList = [...prev, instId];
                                setReturnQuantity(newList.length); // Cập nhật returnQuantity theo số lượng thực tế
                                return newList;
                              });
                            }
                          }}
                        >
                          <Space>
                            <Checkbox
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                if (e.target.checked) {
                                  setSelectedInstanceIds(prev => {
                                    // Kiểm tra xem đã có trong list chưa để tránh duplicate
                                    if (prev.includes(instId)) {
                                      return prev; // Đã có rồi, không thêm nữa
                                    }
                                    const newList = [...prev, instId];
                                    setReturnQuantity(newList.length); // Cập nhật returnQuantity theo số lượng thực tế
                                    return newList;
                                  });
                                } else {
                                  setSelectedInstanceIds(prev => {
                                    const newList = prev.filter(id => id !== instId);
                                    setReturnQuantity(newList.length); // Cập nhật returnQuantity theo số lượng thực tế
                                    return newList;
                                  });
                                  if (isBroken) {
                                    setBrokenInstanceIds(prev => {
                                      const newBrokenList = prev.filter(id => id !== instId);
                                      setBrokenQuantity(newBrokenList.length); // Cập nhật brokenQuantity theo số lượng thực tế
                                      return newBrokenList;
                                    });
                                  }
                                }
                              }}
                            />
                            <Text 
                              code 
                              style={{ 
                                fontSize: 14, 
                                fontWeight: 500,
                                wordBreak: 'break-all',
                                whiteSpace: 'normal',
                                maxWidth: '100%',
                              }}
                              title={serialNumber}
                            >
                              {serialNumber}
                            </Text>
                            {isBroken && (
                              <Tag color="red" icon={<CloseCircleOutlined />}>
                                Hỏng
                              </Tag>
                            )}
                          </Space>
                        </div>
                      );
                    })}
                  </Space>
                </div>
                
                {selectedInstanceIds.length === 0 && (
                  <Text type="danger" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                    Vui lòng chọn ít nhất một mã serial để trả
                  </Text>
                )}
              </div>

              {/* Chỉ hiển thị phần "Thiết bị bị hỏng" khi đã chọn ít nhất 1 serial */}
              {selectedInstanceIds.length > 0 && (
                <>
                  <Divider orientation="left" style={{ marginTop: 16, marginBottom: 16 }}>
                    <Space>
                      <CloseCircleOutlined style={{ color: '#f5222d' }} />
                      <Text strong>Đánh dấu thiết bị bị hỏng (nếu có)</Text>
                    </Space>
                  </Divider>

                  {/* Thông báo: Tất cả thiết bị hỏng sẽ được gửi về trường sửa */}
                  <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#fff7e6', border: '1px solid #ffd591', borderRadius: 4 }}>
                    <Space>
                      <WarningOutlined style={{ color: '#fa8c16' }} />
                      <Text strong style={{ color: '#fa8c16' }}>
                        Tất cả thiết bị hỏng sẽ được gửi về trường để School Admin sửa chữa
                      </Text>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4, marginLeft: 24 }}>
                      Hệ thống sẽ tự động tạo yêu cầu sửa chữa gửi về School Admin. Sau khi School Admin sửa xong, thiết bị sẽ tự động được cập nhật là đã trả.
                    </Text>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                      Chọn các mã serial bị hỏng trong số {selectedInstanceIds.length} mã serial đã chọn:
                    </Text>
                    
                    <div
                      className="serial-scroll-container"
                      style={{
                        maxHeight: '150px',
                        overflowY: 'auto',
                        overflowX: 'auto',
                        padding: '8px',
                        border: '1px solid #ffccc7',
                        borderRadius: '4px',
                        backgroundColor: '#fff1f0',
                      }}
                    >
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        {selectedInstanceIds.map((instId) => {
                          const inst = (selectedRecord.device_instances || []).find(i => {
                            const id = i._id?.toString() || i.toString();
                            return id === instId;
                          });
                          const serialNumber = inst?.serial_number || instId.slice(-8);
                          const isBroken = brokenInstanceIds.includes(instId);
                          
                          return (
                            <div
                              key={instId}
                              style={{
                                padding: '8px',
                                border: isBroken ? '2px solid #ff4d4f' : '1px solid #ffccc7',
                                borderRadius: '4px',
                                backgroundColor: isBroken ? '#fff1f0' : 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                              onClick={() => {
                                if (isBroken) {
                                  // Bỏ đánh dấu hỏng
                                  setBrokenInstanceIds(prev => prev.filter(id => id !== instId));
                                  setBrokenQuantity(prev => Math.max(0, prev - 1));
                                } else {
                                  // Đánh dấu hỏng
                                  setBrokenInstanceIds(prev => [...prev, instId]);
                                  setBrokenQuantity(prev => prev + 1);
                                }
                              }}
                            >
                              <Space>
                                <Checkbox
                                  checked={isBroken}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    if (e.target.checked) {
                                      setBrokenInstanceIds(prev => [...prev, instId]);
                                      setBrokenQuantity(prev => prev + 1);
                                    } else {
                                      setBrokenInstanceIds(prev => prev.filter(id => id !== instId));
                                      setBrokenQuantity(prev => Math.max(0, prev - 1));
                                    }
                                  }}
                                />
                                <Text 
                                  code 
                                  style={{ 
                                    fontSize: 14, 
                                    fontWeight: 500,
                                    wordBreak: 'break-all',
                                    whiteSpace: 'normal',
                                    maxWidth: '100%',
                                  }}
                                  title={serialNumber}
                                >
                                  {serialNumber}
                                </Text>
                                {isBroken && (
                                  <Tag color="red" icon={<CloseCircleOutlined />}>
                                    Hỏng
                                  </Tag>
                                )}
                              </Space>
                            </div>
                          );
                        })}
                      </Space>
                    </div>
                    
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                      Đã chọn: {brokenInstanceIds.length} / {selectedInstanceIds.length} thiết bị hỏng
                    </Text>
                  </div>

                  {brokenInstanceIds.length > 0 && (
                    <>
                      <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
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
                      </Descriptions>

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
                            Lưu ý: {brokenInstanceIds.length} thiết bị bị hỏng sẽ được gửi về trường để sửa chữa. Sau khi trường sửa xong, thiết bị sẽ tự động được cập nhật là đã trả.
                          </Text>
                        </Space>
                      </div>
                    </>
                  )}
                </>
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

