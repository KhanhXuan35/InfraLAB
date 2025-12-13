import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Tag,
  Typography,
  Space,
  Button,
  Select,
  Empty,
  Spin,
  Image,
  Descriptions,
  Modal,
  message,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  ArrowLeftOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../../services/api';
import { STUDENT_ROUTES } from '../../../constants/routes';
import * as S from './LoanDeviceList.styles';

const { Title, Text } = Typography;
const { Option } = Select;

const LoanDeviceList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [sortField, setSortField] = useState(null); // 'createdAt' | 'return_due_date' | null
  const [sortOrder, setSortOrder] = useState(null); // 'asc' | 'desc' | null
  const [allLoans, setAllLoans] = useState([]); // Lưu toàn bộ data từ API
  const [stats, setStats] = useState({
    total: 0,
    borrowed: 0,
    returnPending: 0,
    returned: 0,
  });

  useEffect(() => {
    fetchLoanList();
  }, [statusFilter, pagination.page]);

  // Sort data khi sortField, sortOrder hoặc allLoans thay đổi
  useEffect(() => {
    if (allLoans.length === 0) {
      setLoans([]);
      return;
    }
    
    if (sortField && sortOrder) {
      const sortedLoans = [...allLoans].sort((a, b) => {
        const dateA = dayjs(a[sortField]);
        const dateB = dayjs(b[sortField]);
        return sortOrder === 'asc' ? dateA.diff(dateB) : dateB.diff(dateA);
      });
      setLoans(sortedLoans);
    } else {
      setLoans(allLoans);
    }
  }, [sortField, sortOrder, allLoans]);

  const fetchLoanList = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await api.get('/borrow', { params });
      
      if (response.success) {
        const fetchedLoans = response.data || [];
        setAllLoans(fetchedLoans);
        
        // Sort sẽ được xử lý trong useEffect khi allLoans thay đổi
        
        setPagination({
          ...pagination,
          total: response.pagination?.total || 0,
          totalPages: response.pagination?.totalPages || 0,
        });
        
        // Tính stats
        calculateStats(fetchedLoans);
      } else {
        message.error(response.message || 'Không thể tải danh sách thiết bị đã mượn');
      }
    } catch (error) {
      console.error('Error fetching loan list:', error);
      message.error(error.message || 'Có lỗi xảy ra khi tải danh sách');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (loanData) => {
    const statsData = {
      total: loanData.length,
      borrowed: 0,
      returnPending: 0,
      returned: 0,
    };

    loanData.forEach((loan) => {
      if (loan.status === 'borrowed') statsData.borrowed++;
      else if (loan.status === 'return_pending') statsData.returnPending++;
      else if (loan.status === 'returned') statsData.returned++;
    });

    setStats(statsData);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setPagination({ ...pagination, page: 1 });
  };

  const handlePageChange = (page) => {
    setPagination({ ...pagination, page });
  };

  const handleViewDetail = (loan) => {
    setSelectedLoan(loan);
    setDetailModalVisible(true);
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      borrowed: { color: 'blue', text: 'Đang mượn' },
      return_pending: { color: 'orange', text: 'Chờ trả' },
      returned: { color: 'green', text: 'Đã trả' },
    };
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const handleSort = (field) => {
    if (sortField === field) {
      // Nếu đang sort field này, đổi hướng
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else if (sortOrder === 'desc') {
        // Reset về không sort
        setSortField(null);
        setSortOrder(null);
      }
    } else {
      // Sort field mới, mặc định tăng dần
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      // Không sort field này - hiển thị cả 2 mũi tên xám
      return (
        <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: 4, verticalAlign: 'middle' }}>
          <ArrowUpOutlined style={{ fontSize: 10, color: '#d9d9d9', lineHeight: '8px' }} />
          <ArrowDownOutlined style={{ fontSize: 10, color: '#d9d9d9', lineHeight: '8px' }} />
        </span>
      );
    }
    
    // Đang sort field này
    if (sortOrder === 'asc') {
      // Tăng dần - mũi tên lên xanh, mũi tên xuống xám
      return (
        <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: 4, verticalAlign: 'middle' }}>
          <ArrowUpOutlined style={{ fontSize: 10, color: '#1890ff', lineHeight: '8px' }} />
          <ArrowDownOutlined style={{ fontSize: 10, color: '#d9d9d9', lineHeight: '8px' }} />
        </span>
      );
    } else {
      // Giảm dần - mũi tên lên xám, mũi tên xuống xanh
      return (
        <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: 4, verticalAlign: 'middle' }}>
          <ArrowUpOutlined style={{ fontSize: 10, color: '#d9d9d9', lineHeight: '8px' }} />
          <ArrowDownOutlined style={{ fontSize: 10, color: '#1890ff', lineHeight: '8px' }} />
        </span>
      );
    }
  };

  const columns = [
    {
      title: 'Mã yêu cầu',
      dataIndex: '_id',
      key: '_id',
      render: (id) => <Text code>{id.slice(-8)}</Text>,
      width: 120,
    },
    {
      title: 'Sinh viên',
      key: 'student',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.student?.name || 'N/A'}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.student?.student_code || record.student?.email}
          </Text>
        </div>
      ),
      width: 200,
    },
    {
      title: 'Thiết bị',
      key: 'devices',
      render: (_, record) => (
        <div>
          {record.items?.slice(0, 2).map((item, idx) => (
            <div key={idx} style={{ marginBottom: 4 }}>
              <Text strong>{item.device?.name}</Text>
              <Text type="secondary"> x{item.quantity}</Text>
            </div>
          ))}
          {record.items?.length > 2 && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              +{record.items.length - 2} thiết bị khác
            </Text>
          )}
        </div>
      ),
      width: 250,
    },
    {
      title: (
        <span 
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => handleSort('createdAt')}
        >
          Ngày mượn
          {renderSortIcon('createdAt')}
        </span>
      ),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
      width: 120,
    },
    {
      title: (
        <span 
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => handleSort('return_due_date')}
        >
          Hạn trả
          {renderSortIcon('return_due_date')}
        </span>
      ),
      dataIndex: 'return_due_date',
      key: 'return_due_date',
      render: (date, record) => {
        const dueDate = dayjs(date);
        const isOverdue = dueDate.isBefore(dayjs()) && !record.returned;
        return (
          <Text style={{ color: isOverdue ? '#ff4d4f' : 'inherit' }}>
            {dueDate.format('DD/MM/YYYY')}
            {isOverdue && <Tag color="red" style={{ marginLeft: 8 }}>Quá hạn</Tag>}
          </Text>
        );
      },
      width: 150,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      width: 120,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          Chi tiết
        </Button>
      ),
      width: 100,
    },
  ];

  return (
    <S.Container>
      <S.Header>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
          >
            Quay lại
          </Button>
          <Title level={2} style={{ margin: 0 }}>
            Danh sách thiết bị đã mượn
          </Title>
        </Space>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchLoanList}
          loading={loading}
        >
          Làm mới
        </Button>
      </S.Header>

      {/* Stats Section */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng số"
              value={stats.total}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Đang mượn"
              value={stats.borrowed}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Chờ trả"
              value={stats.returnPending}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Đã trả"
              value={stats.returned}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filter Section */}
      <Card style={{ marginBottom: 24 }}>
        <Space>
          <Text strong>Lọc theo trạng thái:</Text>
          <Select
            style={{ width: 200 }}
            placeholder="Tất cả"
            value={statusFilter}
            onChange={handleStatusFilterChange}
            allowClear
          >
            <Option value="borrowed">Đang mượn</Option>
            <Option value="return_pending">Chờ trả</Option>
            <Option value="returned">Đã trả</Option>
          </Select>
        </Space>
      </Card>

      {/* Table Section */}
      <Card>
        <Spin spinning={loading}>
          {loans.length === 0 ? (
            <Empty
              description="Chưa có thiết bị nào được mượn"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <>
              <Table
                columns={columns}
                dataSource={loans}
                rowKey="_id"
                pagination={{
                  current: pagination.page,
                  pageSize: pagination.limit,
                  total: pagination.total,
                  showSizeChanger: false,
                  showTotal: (total) => `Tổng ${total} bản ghi`,
                  onChange: handlePageChange,
                }}
              />
            </>
          )}
        </Spin>
      </Card>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết yêu cầu mượn"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={800}
      >
        {selectedLoan && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Mã yêu cầu" span={2}>
                <Text code>{selectedLoan._id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Sinh viên">
                {selectedLoan.student?.name || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Mã sinh viên">
                {selectedLoan.student?.student_code || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {selectedLoan.student?.email || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {selectedLoan.student?.phone || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày mượn">
                {dayjs(selectedLoan.createdAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Hạn trả">
                {dayjs(selectedLoan.return_due_date).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {getStatusTag(selectedLoan.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Mục đích sử dụng" span={2}>
                {selectedLoan.purpose}
              </Descriptions.Item>
              {selectedLoan.notes && (
                <Descriptions.Item label="Ghi chú" span={2}>
                  {selectedLoan.notes}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Title level={4} style={{ marginTop: 24, marginBottom: 16 }}>
              Danh sách thiết bị
            </Title>
            <Row gutter={[16, 16]}>
              {selectedLoan.items?.map((item, idx) => (
                <Col xs={24} sm={12} key={idx}>
                  <Card size="small">
                    <Space>
                      {item.device?.image && (
                        <Image
                          src={item.device.image}
                          alt={item.device.name}
                          width={60}
                          height={60}
                          style={{ objectFit: 'cover', borderRadius: 4 }}
                        />
                      )}
                      <div>
                        <div style={{ fontWeight: 500 }}>{item.device?.name}</div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.device?.category?.name}
                        </Text>
                        <div>
                          <Text strong>Số lượng: </Text>
                          <Text>{item.quantity}</Text>
                        </div>
                      </div>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}
      </Modal>
    </S.Container>
  );
};

export default LoanDeviceList;

