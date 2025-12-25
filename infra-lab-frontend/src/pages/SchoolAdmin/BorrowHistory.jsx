import React, { useEffect, useState } from 'react';
import { Layout, Table, Tag, message, Space, Typography, Button, Descriptions, Modal, Input } from 'antd';
import {
  EyeOutlined,
  ReloadOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import api from '../../services/api';
import SchoolAdminSidebar from '../../components/Sidebar/SchoolAdminSidebar';
import NotificationBell from '../../components/NotificationBell/NotificationBell';
// Reuse the shared styles from the schooladminfeature BorrowRequests page
import '../schooladminfeature/BorrowRequests.css';

const { Text, Title } = Typography;
const { Search } = Input;

const { Content } = Layout;

const BorrowHistory = () => {
  const [borrowHistory, setBorrowHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Chuẩn hóa danh sách: bỏ trùng theo _id và sắp xếp mới nhất lên trên
  const normalizeRequests = (list) => {
    if (!Array.isArray(list)) return [];
    const map = new Map();
    list.forEach((item) => {
      if (item && item._id) {
        map.set(item._id, item);
      }
    });
    return Array.from(map.values()).sort((a, b) => {
      const aTime = new Date(a.createdAt || a.created_at || 0).getTime();
      const bTime = new Date(b.createdAt || b.created_at || 0).getTime();
      return bTime - aTime;
    });
  };

  const loadBorrowHistory = async () => {
    setLoading(true);
    try {
      // Lấy lịch sử mượn: các RequestLab đã được duyệt (APPROVED) hoặc đã giao (DELIVERED)
      // Chỉ lấy yêu cầu mượn thiết bị có sẵn (exclude_new_devices=true)
      const res = await api.get('/request-lab?requester_role=lab_manager&exclude_new_devices=true');
      const raw = Array.isArray(res) ? res : res?.data || [];
      
      // Lọc chỉ lấy các request đã được duyệt hoặc đã giao
      const history = raw.filter(req => 
        req.status === 'APPROVED' || req.status === 'DELIVERED'
      );
      
      setBorrowHistory(normalizeRequests(history));
    } catch (err) {
      message.error(err?.message || 'Không lấy được lịch sử mượn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBorrowHistory();
  }, []);

  const handleViewDetail = (record) => {
    setSelectedRequest(record);
    setDetailModalVisible(true);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter dữ liệu theo search text
  const filteredHistory = borrowHistory.filter(item => {
    if (!searchText.trim()) return true;
    const searchLower = searchText.toLowerCase();
    const deviceName = item.device_id?.name || '';
    const labManagerName = item.created_by?.name || '';
    const labManagerEmail = item.created_by?.email || '';
    return (
      deviceName.toLowerCase().includes(searchLower) ||
      labManagerName.toLowerCase().includes(searchLower) ||
      labManagerEmail.toLowerCase().includes(searchLower)
    );
  });

  const columns = [
    {
      title: 'Mã yêu cầu',
      dataIndex: '_id',
      width: 150,
      render: (id) => (
        <Text code>{id ? id.slice(-8) : '-'}</Text>
      ),
    },
    {
      title: 'Ảnh',
      dataIndex: 'device_id',
      render: (dev) =>
        dev?.image ? (
          <img
            src={dev.image}
            alt={dev.name}
            className="br-thumb"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/60?text=No+Image';
            }}
          />
        ) : (
          <div className="br-thumb br-thumb-placeholder">No Image</div>
        ),
      width: 90,
    },
    {
      title: 'Thiết bị',
      dataIndex: 'device_id',
      render: (dev) => dev?.name || 'N/A',
    },
    {
      title: 'Số lượng',
      dataIndex: 'qty',
      width: 90,
      align: 'center',
    },
    {
      title: 'Lab Manager',
      dataIndex: 'created_by',
      render: (u) => u?.name || u?.email || 'N/A',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 140,
      render: (status) => {
        const map = {
          APPROVED: { color: 'green', label: 'Đã duyệt' },
          DELIVERED: { color: 'blue', label: 'Đã giao' },
        };
        const cfg = map[status] || { color: 'default', label: status || 'N/A' };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: 'Thời gian yêu cầu',
      dataIndex: 'createdAt',
      render: (v, r) => new Date(v || r.created_at || Date.now()).toLocaleString('vi-VN'),
    },
    {
      title: 'Thời gian duyệt',
      dataIndex: 'approved_at',
      render: (v) => v ? new Date(v).toLocaleString('vi-VN') : '-',
    },
    {
      title: 'Hành động',
      dataIndex: '_id',
      width: 120,
      render: (_, record) => (
        <div className="br-actions">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            Chi tiết
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <SchoolAdminSidebar />
      <Layout style={{ marginLeft: 260 }}>
        <Content style={{ padding: 24 }}>
          <div className="br-header">
            <h2>Lịch sử mượn thiết bị</h2>
            <div className="br-header-actions">
              <NotificationBell />
              <Button
                icon={<ReloadOutlined />}
                onClick={loadBorrowHistory}
                loading={loading}
              >
                Tải lại
              </Button>
            </div>
          </div>

          {/* Search bar */}
          <div style={{ marginBottom: 16 }}>
            <Search
              placeholder="Tìm kiếm theo tên thiết bị, Lab Manager..."
              allowClear
              enterButton
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ maxWidth: 400 }}
            />
          </div>

          <Table
            rowKey={(r) => r._id}
            loading={loading}
            columns={columns}
            dataSource={filteredHistory}
            pagination={{ pageSize: 10 }}
          />

          {/* Modal chi tiết */}
          <Modal
            title={
              <Space>
                <Title level={4} style={{ margin: 0 }}>Chi tiết đơn mượn</Title>
                <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                  In đơn
                </Button>
              </Space>
            }
            open={detailModalVisible}
            onCancel={() => {
              setDetailModalVisible(false);
              setSelectedRequest(null);
            }}
            footer={null}
            width={800}
            className="borrow-detail-modal"
          >
            {selectedRequest && (
              <div id="borrow-detail-content" style={{ padding: '20px 0' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <Title level={3}>ĐƠN MƯỢN THIẾT BỊ</Title>
                  <Text type="secondary">Mã đơn: {selectedRequest._id}</Text>
                </div>

                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="Người yêu cầu" span={2}>
                    <Space>
                      <Text strong>{selectedRequest.created_by?.name || 'N/A'}</Text>
                      <Text type="secondary">({selectedRequest.created_by?.email || 'N/A'})</Text>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Vai trò">
                    <Tag color="blue">Lab Manager</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Thời gian yêu cầu">
                    {new Date(selectedRequest.createdAt || selectedRequest.created_at || Date.now()).toLocaleString('vi-VN')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Thiết bị" span={2}>
                    <Space>
                      {selectedRequest.device_id?.image && (
                        <img
                          src={selectedRequest.device_id.image}
                          alt={selectedRequest.device_id.name}
                          style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
                        />
                      )}
                      <div>
                        <Text strong>{selectedRequest.device_id?.name || 'N/A'}</Text>
                        <br />
                        <Text type="secondary">Số lượng: {selectedRequest.qty}</Text>
                      </div>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Trạng thái">
                    {selectedRequest.status === 'APPROVED' && <Tag color="green">Đã duyệt</Tag>}
                    {selectedRequest.status === 'DELIVERED' && <Tag color="blue">Đã giao</Tag>}
                  </Descriptions.Item>
                  <Descriptions.Item label="Thời gian duyệt">
                    {selectedRequest.approved_at ? new Date(selectedRequest.approved_at).toLocaleString('vi-VN') : '-'}
                  </Descriptions.Item>
                  {selectedRequest.approved_by && (
                    <Descriptions.Item label="Người duyệt" span={2}>
                      <Text>{selectedRequest.approved_by?.name || selectedRequest.approved_by?.email || 'N/A'}</Text>
                    </Descriptions.Item>
                  )}
                  {selectedRequest.device_instance_ids && selectedRequest.device_instance_ids.length > 0 && (
                    <Descriptions.Item label="Danh sách Serial Number" span={2}>
                      <Space wrap>
                        {selectedRequest.device_instance_ids
                          .sort((a, b) => {
                            const serialA = (a.serial_number || '').toLowerCase();
                            const serialB = (b.serial_number || '').toLowerCase();
                            return serialA.localeCompare(serialB);
                          })
                          .map((instance, index) => (
                            <Tag key={instance._id || index} color="blue">
                              {instance.serial_number || 'N/A'}
                            </Tag>
                          ))}
                      </Space>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </div>
            )}
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default BorrowHistory;

