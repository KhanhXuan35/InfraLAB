import React, { useEffect, useState } from 'react';
import { Layout, Button, Table, Tag, message, Tabs } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import api from '../../services/api';
import './BorrowRequests.css';

const { Content } = Layout;

const BorrowRequests = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('borrow');
  const [borrowData, setBorrowData] = useState([]);
  const [deviceData, setDeviceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const loadBorrowRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/request-lab?status=WAITING');
      const list = Array.isArray(res) ? res : res?.data || [];
      setBorrowData(list);
    } catch (err) {
      message.error(err?.message || 'Không lấy được danh sách yêu cầu mượn');
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
    if (activeTab === 'borrow') {
      loadBorrowRequests();
    } else {
      loadPendingDevices();
    }
  }, [activeTab]);

  const handleBorrowAction = async (id, action) => {
    setProcessingId(id);
    try {
      await api.patch(`/request-lab/${id}/${action}`);
      message.success(action === 'approve' ? 'Đã duyệt yêu cầu mượn' : 'Đã từ chối yêu cầu mượn');
      await loadBorrowRequests();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Thao tác thất bại';
      message.error(msg);
    } finally {
      setProcessingId(null);
    }
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

  const borrowColumns = [
    {
      title: 'Thiết bị',
      dataIndex: 'device_id',
      render: (dev) => dev?.name || 'N/A',
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
      title: 'Số lượng',
      dataIndex: 'qty',
      width: 90,
      align: 'center',
    },
    {
      title: 'Người yêu cầu',
      dataIndex: 'created_by',
      render: (u) => u?.name || u?.email || 'N/A',
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      render: (v, r) => new Date(v || r.created_at || Date.now()).toLocaleString(),
    },
    {
      title: 'Hành động',
      dataIndex: '_id',
      width: 180,
      render: (_, record) => (
        <div className="br-actions">
          <Button
            size="small"
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={processingId === record._id}
            disabled={!record.device_id}
            onClick={() => handleBorrowAction(record._id, 'approve')}
          >
            Duyệt
          </Button>
          <Button
            size="small"
            danger
            icon={<CloseCircleOutlined />}
            loading={processingId === record._id}
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
      title: 'Tên thiết bị',
      dataIndex: 'name',
      render: (name) => name || 'N/A',
    },
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
      key: 'borrow',
      label: 'Yêu cầu mượn thiết bị',
      children: (
        <Table
          rowKey={(r) => r._id}
          loading={loading}
          columns={borrowColumns}
          dataSource={borrowData}
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
      <Content style={{ padding: 24 }}>
        <div className="br-header">
          <h2>Quản lý yêu cầu</h2>
          <div className="br-header-actions">
            <Button
              icon={<ReloadOutlined />}
              onClick={() => activeTab === 'borrow' ? loadBorrowRequests() : loadPendingDevices()}
              loading={loading}
            >
              Tải lại
            </Button>
            <Button type="link" onClick={() => navigate('/school-dashboard')}>
              Về dashboard
            </Button>
          </div>
        </div>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Content>
    </Layout>
  );
};

export default BorrowRequests;
