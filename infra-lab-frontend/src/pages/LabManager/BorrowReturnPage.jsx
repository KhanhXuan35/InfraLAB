import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
  Divider,
  Select,
  DatePicker,
  Row,
  Col
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
} from '@ant-design/icons';
import api from '../../services/api';
import LabManagerSidebar from '../../components/Sidebar/LabManagerSidebar';
import dayjs from 'dayjs';

const { Header: LayoutHeader, Content } = Layout;
const { Title, Text } = Typography;

const BorrowReturnPage = () => {
  // --- STATE DỮ LIỆU & LOGIC CŨ ---
  const [borrowRequests, setBorrowRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Modal
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [requestReturnModalVisible, setRequestReturnModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // State xử lý
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedBorrowId, setSelectedBorrowId] = useState(null);
  const [selectedBorrowRequest, setSelectedBorrowRequest] = useState(null);

  // Form Data
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [brokenQuantity, setBrokenQuantity] = useState(0);
  const [brokenReason, setBrokenReason] = useState('');
  const [isRepairedItem, setIsRepairedItem] = useState(false); // Flag để phân biệt thiết bị đã sửa
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedBorrowRequest, setSelectedBorrowRequest] = useState(null);
  const [filteredInfo, setFilteredInfo] = useState({});
  const [sortedInfo, setSortedInfo] = useState({});

  useEffect(() => {
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

  // --- CÁC HÀM XỬ LÝ (Giữ nguyên) ---
  const handleRequestReturn = (borrowId) => {
    setSelectedBorrowId(borrowId);
    setRequestReturnModalVisible(true);
  };

  const handleReturnFromRequest = (borrowRequest) => {
    if (borrowRequest.items.length === 1) {
      handleReturn(borrowRequest.items[0], borrowRequest);
    } else {
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
        fetchBorrowingStudents();
      } else {
        message.error(response.message || 'Lỗi khi yêu cầu trả thiết bị');
      }
    } catch (error) {
      message.error(error.message || 'Lỗi khi yêu cầu trả thiết bị');
    }
  };

  const handleViewDetail = (borrowRequest) => {
    setSelectedBorrowRequest(borrowRequest);
    setDetailModalVisible(true);
  };

  const handleReturn = (item, borrowRequest) => {
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
    setIsRepairedItem(false);
    setReturnModalVisible(true);
  };

  const handleConfirmReturn = async () => {
    if (!selectedRecord) return;

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
          fetchBorrowingStudents();
          if (detailModalVisible) setDetailModalVisible(false);
        } else {
          message.error(response.message);
        }
      } catch (error) {
        message.error(error.message);
      }
      return;
    }

    if (brokenQuantity > returnQuantity) {
      message.error('Số lượng hỏng không được vượt quá số lượng trả');
      return;
    }
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
        message.success('Ghi nhận trả thiết bị thành công!');
        setReturnModalVisible(false);
        fetchBorrowingStudents();
        if (detailModalVisible) setDetailModalVisible(false);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error(error.message);
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
      year: 'numeric', month: 'long', day: 'numeric',
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

  // --- CẤU HÌNH CỘT (Giữ nguyên logic filter cũ của bạn) ---
  const columns = [
    {
      title: 'Mã yêu cầu',
      dataIndex: 'borrowIdString',
      key: 'borrowId',
      width: 200,
      filteredValue: filteredInfo.borrowIdString || null,
      onFilter: (value, record) => record.borrowIdString.toLowerCase().includes(value.toLowerCase()),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Tìm mã yêu cầu"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90 }}>Tìm</Button>
            <Button onClick={() => { clearFilters(); confirm(); }} size="small" style={{ width: 90 }}>Reset</Button>
          </Space>
        </div>
      ),
      render: (text) => <Text code>{text?.slice(-8)}</Text>,
    },
    {
      title: 'Tổng thiết bị',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      align: 'center',
      width: 150,
      sorter: (a, b) => a.totalQuantity - b.totalQuantity,
      render: (val) => <Text strong>{val}</Text>,
    },
    {
      title: 'Ngày hẹn trả',
      dataIndex: 'returnDueDate',
      key: 'returnDueDate',
      width: 200,
      sorter: (a, b) => new Date(a.returnDueDate) - new Date(b.returnDueDate),
      render: (date) => <Space><CalendarOutlined /> <Text>{formatDate(date)}</Text></Space>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 220,
      filteredValue: filteredInfo.status || null,
      onFilter: (value, record) => {
        if (value === 'overdue') return record.isOverdue && !record.returnRequested;
        if (value === 'overdue_requested') return record.isOverdue && record.returnRequested;
        return record.status === value;
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Select
            style={{ width: 188, marginBottom: 8, display: 'block' }}
            placeholder="Chọn trạng thái"
            value={selectedKeys[0]}
            onChange={val => setSelectedKeys(val ? [val] : [])}
          >
            <Option value="borrowed">Đang mượn</Option>
            <Option value="return_pending">Chờ trả</Option>
            <Option value="overdue">Quá hạn</Option>
          </Select>
          <Space>
            <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90 }}>Lọc</Button>
            <Button onClick={() => { clearFilters(); confirm(); }} size="small" style={{ width: 90 }}>Reset</Button>
          </Space>
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
          <Button icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>Chi tiết</Button>
          {record.isOverdue && !record.returnRequested ? (
            <Button type="primary" danger icon={<ExclamationCircleOutlined />} onClick={() => handleRequestReturn(record.borrowId)}>Yêu cầu trả</Button>
          ) : (
            <Button type="primary" icon={<CheckOutlined />} onClick={() => handleReturnFromRequest(record)}>Ghi nhận trả</Button>
          )}
        </Space>
      ),
    },
  ];

  // --- RENDER GIAO DIỆN (Đã bỏ Layout, Sider, Header cũ) ---
  return (
    <Layout style={{ minHeight: '100vh' }}>
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

      {/* --- CÁC MODAL (GIỮ NGUYÊN) --- */}

      {/* Modal Chi tiết */}
      <Modal
        title={<Space><FileTextOutlined /><span>Chi tiết yêu cầu mượn</span></Space>}
        open={detailModalVisible}
        onCancel={() => { setDetailModalVisible(false); setSelectedBorrowRequest(null); }}
        footer={[<Button key="close" onClick={() => setDetailModalVisible(false)}>Đóng</Button>]}
        width={900}
      >
        {selectedBorrowRequest && (
          <div>
            <Divider orientation="left"><Space><UserOutlined /><Text strong>Thông tin sinh viên</Text></Space></Divider>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Họ tên"><Space><Avatar style={{ backgroundColor: '#1890ff' }}>{selectedBorrowRequest.student.name?.charAt(0)}</Avatar><Text strong>{selectedBorrowRequest.student.name}</Text></Space></Descriptions.Item>
              <Descriptions.Item label="Email">{selectedBorrowRequest.student.email}</Descriptions.Item>
              <Descriptions.Item label="MSSV">{selectedBorrowRequest.student.student_code}</Descriptions.Item>
              <Descriptions.Item label="SĐT">{selectedBorrowRequest.student.phone}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left"><Space><FileTextOutlined /><Text strong>Thông tin mượn</Text></Space></Divider>
            {/* Bảng thiết bị trong Modal */}
            <Table
              dataSource={selectedBorrowRequest.items}
              rowKey={item => item.device._id}
              pagination={false}
              size="small"
              columns={[
                { title: 'Thiết bị', render: (_, item) => <Space><Avatar src={item.device.image} shape="square" /><Text strong>{item.device.name}</Text></Space> },
                { title: 'SL', dataIndex: 'quantity', align: 'center' },
                {
                  title: 'Thao tác', align: 'center', render: (_, item) => (
                    <Button type="primary" size="small" onClick={() => { setDetailModalVisible(false); handleReturn(item, selectedBorrowRequest); }}>Ghi nhận trả</Button>
                  )
                }
              ]}
            />

            {/* Bảng thiết bị đang sửa */}
            {selectedBorrowRequest.repairingItems?.length > 0 && (
              <>
                <Divider orientation="left"><Space><WarningOutlined /><Text strong>Thiết bị đang sửa</Text></Space></Divider>
                <Table
                  dataSource={selectedBorrowRequest.repairingItems}
                  rowKey={item => item.device._id}
                  pagination={false}
                  size="small"
                  columns={[
                    { title: 'Thiết bị', render: (_, item) => item.device.name },
                    { title: 'SL', dataIndex: 'quantity', align: 'center' },
                    { title: 'Lý do', dataIndex: 'broken_reason' },
                    {
                      title: 'Thao tác', align: 'center', render: (_, item) => (
                        <Button size="small" onClick={() => {
                          setDetailModalVisible(false);
                          setSelectedRecord({ ...item, borrowId: selectedBorrowRequest.borrowId });
                          setReturnQuantity(item.quantity);
                          setBrokenQuantity(0);
                          setIsRepairedItem(true);
                          setReturnModalVisible(true);
                        }}>Đã sửa xong</Button>
                      )
                    }
                  ]}
                />
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Yêu cầu trả */}
      <Modal
        title="Yêu cầu trả thiết bị quá hạn"
        open={requestReturnModalVisible}
        onOk={handleConfirmRequestReturn}
        onCancel={() => setRequestReturnModalVisible(false)}
        okText="Xác nhận"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <p>Bạn có chắc chắn muốn yêu cầu sinh viên trả lại thiết bị quá hạn không?</p>
      </Modal>

      {/* Modal Ghi nhận trả */}
      <Modal
        title={isRepairedItem ? "Ghi nhận trả thiết bị đã sửa" : "Ghi nhận trả thiết bị"}
        open={returnModalVisible}
        onOk={handleConfirmReturn}
        onCancel={() => setReturnModalVisible(false)}
        okText="Xác nhận"
        cancelText="Hủy"
      >
        {selectedRecord && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Thiết bị">{selectedRecord.device.name}</Descriptions.Item>
              <Descriptions.Item label="SL đang mượn">{selectedRecord.quantity}</Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16 }}>
              <Text>Số lượng trả:</Text>
              <InputNumber min={1} max={selectedRecord.quantity} value={returnQuantity} onChange={setReturnQuantity} style={{ width: '100%' }} />
            </div>
            {!isRepairedItem && (
              <div style={{ marginTop: 16 }}>
                <Text type="danger">Số lượng hỏng (nếu có):</Text>
                <InputNumber min={0} max={returnQuantity} value={brokenQuantity} onChange={setBrokenQuantity} style={{ width: '100%' }} />
                {brokenQuantity > 0 && (
                  <Input.TextArea
                    placeholder="Lý do hỏng..."
                    value={brokenReason}
                    onChange={e => setBrokenReason(e.target.value)}
                    style={{ marginTop: 8 }}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

    </Layout>
  );
};

export default BorrowReturnPage;