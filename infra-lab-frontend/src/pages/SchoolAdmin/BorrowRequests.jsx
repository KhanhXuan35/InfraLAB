import React, { useEffect, useState } from 'react';
import { Layout, Button, Table, Tag, message, Tabs, Modal, Descriptions, Space, Typography, Divider, Input } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import api from '../../services/api';
import SchoolAdminSidebar from '../../components/Sidebar/SchoolAdminSidebar';
import NotificationBell from '../../components/NotificationBell/NotificationBell';
import './BorrowRequests.css';

const { Text, Title } = Typography;
const { TextArea } = Input;

const { Content } = Layout;

const BorrowRequests = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('lab-manager');
  const [labManagerRequests, setLabManagerRequests] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [deviceData, setDeviceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState(null);

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

  const loadLabManagerRequests = async () => {
    setLoading(true);
    try {
      // Lấy yêu cầu từ lab managers (role lab_manager) - chỉ lấy WAITING
      // exclude_new_devices=true để loại bỏ yêu cầu thiết bị ngoài (chỉ lấy yêu cầu mượn thiết bị có sẵn)
      const res = await api.get('/request-lab?status=WAITING&requester_role=lab_manager&exclude_new_devices=true');
      const raw = Array.isArray(res) ? res : res?.data || [];
      setLabManagerRequests(normalizeRequests(raw));
    } catch (err) {
      message.error(err?.message || 'Không lấy được danh sách yêu cầu mượn từ Lab Manager');
    } finally {
      setLoading(false);
    }
  };

  const loadApprovedRequests = async () => {
    setLoading(true);
    try {
      // Lấy các đơn đã duyệt (APPROVED) - chỉ lấy yêu cầu mượn thiết bị có sẵn
      // exclude_new_devices=true để loại bỏ yêu cầu thiết bị ngoài
      const res = await api.get('/request-lab?status=APPROVED&requester_role=lab_manager&exclude_new_devices=true');
      const raw = Array.isArray(res) ? res : res?.data || [];
      setApprovedRequests(normalizeRequests(raw));
    } catch (err) {
      message.error(err?.message || 'Không lấy được danh sách đơn đã duyệt');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingDevices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/devices/pending');
      const list = Array.isArray(res) ? res : res?.data || [];
      setDeviceData(list);
    } catch (err) {
      message.error(err?.message || 'Không lấy được danh sách thiết bị chờ duyệt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'lab-manager') {
      loadLabManagerRequests();
    } else if (activeTab === 'approved') {
      loadApprovedRequests();
    } else {
      loadPendingDevices();
    }
  }, [activeTab]);

  const handleRejectClick = (id) => {
    setRejectingId(id);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectingId) return;
    
    if (!rejectReason || rejectReason.trim() === '') {
      message.warning('Vui lòng nhập lý do từ chối');
      return;
    }

    setProcessingId(rejectingId);
    try {
      await api.patch(`/request-lab/${rejectingId}/reject`, {
        reason: rejectReason.trim()
      });
      message.success('Đã từ chối yêu cầu mượn');
      setRejectModalVisible(false);
      setRejectReason('');
      setRejectingId(null);
      if (activeTab === 'lab-manager') {
        await loadLabManagerRequests();
      }
    } catch (err) {
      console.error('reject error:', err);
      const msg = err?.message || err?.response?.data?.message || 'Thao tác thất bại';
      message.error(msg);
    } finally {
      setProcessingId(null);
    }
  };

  const handleBorrowAction = async (id, action) => {
    if (action === 'reject') {
      handleRejectClick(id);
      return;
    }
    
    setProcessingId(id);
    try {
      await api.patch(`/request-lab/${id}/${action}`);
      message.success(action === 'approve' ? 'Đã duyệt yêu cầu mượn' : 'Đã từ chối yêu cầu mượn');
      if (activeTab === 'lab-manager') {
        await loadLabManagerRequests();
      }
    } catch (err) {
      console.error(`${action} error:`, err);
      const msg = err?.message || err?.response?.data?.message || 'Thao tác thất bại';
      message.error(msg);
    } finally {
      setProcessingId(null);
    }
  };

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      // Duyệt yêu cầu (chỉ duyệt, chưa chuyển location)
      const response = await api.patch(`/request-lab/${id}/approve`);
      message.success('Đã duyệt yêu cầu. Chứng nhận đã được tạo. Lab Manager cần mang đơn đến để nhận thiết bị.');
      
      await loadLabManagerRequests();
      if (activeTab === 'approved') {
        await loadApprovedRequests();
      }
    } catch (err) {
      console.error('Approve error:', err);
      const msg = err?.message || err?.response?.data?.message || 'Thao tác thất bại';
      message.error(msg);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeliver = async (id) => {
    setProcessingId(id);
    try {
      // Xác nhận đã giao - chuyển thiết bị sang Lab
      const response = await api.patch(`/request-lab/${id}/deliver`);
      
      if (response?.success !== false) {
        message.success(response?.message || 'Đã xác nhận giao thiết bị. Thiết bị đã được chuyển sang phòng Lab.');
        await loadApprovedRequests();
      } else {
        message.error(response?.message || 'Thao tác thất bại');
      }
    } catch (err) {
      console.error('Deliver error:', err);
      const errorMsg = err?.message || err?.response?.data?.message || err?.response?.data?.error || 'Thao tác thất bại';
      message.error(errorMsg);
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewDetail = (record) => {
    setSelectedRequest(record);
    setDetailModalVisible(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDeviceAction = async (id, action) => {
    setProcessingId(id);
    try {
      await api.patch(`/devices/${id}/${action}`);
      message.success(action === 'approve' ? 'Đã duyệt thiết bị' : 'Đã từ chối thiết bị');
      await loadPendingDevices();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Thao tác thất bại';
      message.error(msg);
    } finally {
      setProcessingId(null);
    }
  };

  // Columns cho tab "Đơn đã duyệt"
  const approvedColumns = [
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
      title: 'Thời gian duyệt',
      dataIndex: 'approved_at',
      render: (v, r) => v ? new Date(v).toLocaleString('vi-VN') : '-',
    },
    {
      title: 'Hành động',
      dataIndex: '_id',
      width: 200,
      render: (_, record) => (
        <div className="br-actions">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            Chi tiết
          </Button>
          {record.status === 'APPROVED' && (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={processingId === record._id}
              onClick={() => handleDeliver(record._id)}
            >
              Xác nhận đã giao
            </Button>
          )}
        </div>
      ),
    },
  ];

  const labManagerColumns = [
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
          WAITING: { color: 'gold', label: 'Chờ duyệt' },
          APPROVED: { color: 'green', label: 'Đã duyệt' },
          REJECTED: { color: 'red', label: 'Từ chối' },
          DELIVERED: { color: 'blue', label: 'Đã giao' },
        };
        const cfg = map[status] || { color: 'default', label: status || 'N/A' };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: 'Thời gian yêu cầu',
      dataIndex: 'createdAt',
      render: (v, r) => new Date(v || r.created_at || Date.now()).toLocaleString(),
    },
    {
      title: 'Hành động',
      dataIndex: '_id',
      width: 250,
      render: (_, record) => (
        <div className="br-actions">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            Chi tiết
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={processingId === record._id}
            disabled={!record.device_id || record.status !== 'WAITING'}
            onClick={() => handleApprove(record._id)}
          >
            Duyệt
          </Button>
          <Button
            size="small"
            danger
            icon={<CloseCircleOutlined />}
            loading={processingId === record._id}
            disabled={record.status !== 'WAITING'}
            onClick={() => handleBorrowAction(record._id, 'reject')}
          >
            Từ chối
          </Button>
        </div>
      ),
    },
  ];

  const deviceColumns = [
    {
      title: 'Ảnh',
      dataIndex: 'image',
      render: (image, record) =>
        image ? (
          <img
            src={image}
            alt={record.name}
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
      title: 'Tên thiết bị',
      dataIndex: 'name',
      render: (name) => name || 'N/A',
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      render: (cat) => cat?.name || 'N/A',
    },
    {
      title: 'Số lượng',
      dataIndex: 'inventory',
      render: (inv) => inv?.total || 0,
      width: 90,
      align: 'center',
    },
    {
      title: 'Người tạo',
      dataIndex: 'createdBy',
      render: (u) => u?.name || u?.email || 'N/A',
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      render: (v) => new Date(v || Date.now()).toLocaleString(),
    },
    {
      title: 'Hành động',
      dataIndex: '_id',
      width: 180,
      render: (id) => (
        <div className="br-actions">
          <Button
            size="small"
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={processingId === id}
            onClick={() => handleDeviceAction(id, 'approve')}
          >
            Duyệt
          </Button>
          <Button
            size="small"
            danger
            icon={<CloseCircleOutlined />}
            loading={processingId === id}
            onClick={() => handleDeviceAction(id, 'reject')}
          >
            Từ chối
          </Button>
        </div>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'lab-manager',
      label: 'Yêu cầu mượn thiết bị (Lab Manager)',
      children: (
        <Table
          rowKey={(r) => r._id}
          loading={loading}
          columns={labManagerColumns}
          dataSource={labManagerRequests}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'approved',
      label: 'Đơn đã duyệt',
      children: (
        <Table
          rowKey={(r) => r._id}
          loading={loading}
          columns={approvedColumns}
          dataSource={approvedRequests}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'device',
      label: 'Yêu cầu thiết bị mới',
      children: (
        <Table
          rowKey={(r) => r._id}
          loading={loading}
          columns={deviceColumns}
          dataSource={deviceData}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <SchoolAdminSidebar />
      <Layout style={{ marginLeft: 260 }}>
        <Content style={{ padding: 24 }}>
          <div className="br-header">
            <h2>Quản lý yêu cầu</h2>
            <div className="br-header-actions">
              <NotificationBell />
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  if (activeTab === 'lab-manager') loadLabManagerRequests();
                  else if (activeTab === 'approved') loadApprovedRequests();
                  else loadPendingDevices();
                }}
                loading={loading}
              >
                Tải lại
              </Button>
            </div>
          </div>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
          />

          {/* Modal chi tiết đơn mượn */}
          <Modal
            title={
              <Space>
                <Title level={4} style={{ margin: 0 }}>Đơn mượn thiết bị</Title>
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

                <Divider />

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
                    {selectedRequest.status === 'WAITING' && <Tag color="orange">Chờ duyệt</Tag>}
                    {selectedRequest.status === 'APPROVED' && <Tag color="green">Đã duyệt</Tag>}
                    {selectedRequest.status === 'REJECTED' && <Tag color="red">Từ chối</Tag>}
                    {selectedRequest.status === 'DELIVERED' && <Tag color="blue">Đã giao</Tag>}
                  </Descriptions.Item>
                  {selectedRequest.device_instance_ids && selectedRequest.device_instance_ids.length > 0 && (
                    <Descriptions.Item label="Danh sách Serial Number đã cấp" span={2}>
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
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Các thiết bị đã được cấp theo thứ tự serial number từ thấp đến cao
                        </Text>
                      </div>
                    </Descriptions.Item>
                  )}
                </Descriptions>

                <Divider />

                <div style={{ marginTop: 24, padding: '16px', background: '#f5f5f5', borderRadius: 4 }}>
                  <Text strong>Lưu ý:</Text>
                  <br />
                  <Text type="secondary">
                    Đơn mượn này được tạo bởi Lab Manager. Sau khi duyệt, Lab Manager cần mang đơn này đến nhận thiết bị.
                  </Text>
                </div>

                <div style={{ marginTop: 24, textAlign: 'center' }}>
                  <Space>
                    {selectedRequest.status === 'WAITING' && (
                      <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={() => {
                          handleApprove(selectedRequest._id);
                          setDetailModalVisible(false);
                        }}
                        loading={processingId === selectedRequest._id}
                      >
                        Duyệt
                      </Button>
                    )}
                    {selectedRequest.status === 'APPROVED' && (
                      <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={() => {
                          handleDeliver(selectedRequest._id);
                          setDetailModalVisible(false);
                        }}
                        loading={processingId === selectedRequest._id}
                      >
                        Xác nhận đã giao
                      </Button>
                    )}
                    {selectedRequest.status === 'WAITING' && (
                      <Button
                        danger
                        icon={<CloseCircleOutlined />}
                        onClick={() => {
                          setDetailModalVisible(false);
                          handleRejectClick(selectedRequest._id);
                        }}
                        loading={processingId === selectedRequest._id}
                      >
                        Từ chối
                      </Button>
                    )}
                  </Space>
                </div>
              </div>
            )}
          </Modal>

          {/* Modal nhập lý do từ chối */}
          <Modal
            title="Từ chối yêu cầu mượn thiết bị"
            open={rejectModalVisible}
            onOk={handleRejectConfirm}
            onCancel={() => {
              setRejectModalVisible(false);
              setRejectReason('');
              setRejectingId(null);
            }}
            okText="Xác nhận từ chối"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            confirmLoading={processingId === rejectingId}
          >
            <div style={{ marginBottom: 16 }}>
              <Text>Vui lòng nhập lý do từ chối yêu cầu mượn thiết bị:</Text>
            </div>
            <TextArea
              rows={4}
              placeholder="Nhập lý do từ chối..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              maxLength={500}
              showCount
            />
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default BorrowRequests;
