import React, { useEffect, useState } from 'react';
import { Layout, Button, Table, Tag, message } from 'antd';
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
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/request-lab?status=WAITING');
      const list = Array.isArray(res) ? res : res?.data || [];
      setData(list);
    } catch (err) {
      message.error(err?.message || 'Không lấy được danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (id, action) => {
    setProcessingId(id);
    try {
      await api.patch(`/request-lab/${id}/${action}`);
      message.success(action === 'approve' ? 'Đã duyệt' : 'Đã từ chối');
      await loadData();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Thao tác thất bại';
      message.error(msg);
    } finally {
      setProcessingId(null);
    }
  };

  const columns = [
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
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (s) => (
        <Tag color={s === 'WAITING' ? 'gold' : s === 'APPROVED' ? 'green' : 'red'}>
          {s}
        </Tag>
      ),
      width: 120,
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
            onClick={() => handleAction(record._id, 'approve')}
          >
            Duyệt
          </Button>
          <Button
            size="small"
            danger
            icon={<CloseCircleOutlined />}
            loading={processingId === record._id}
            onClick={() => handleAction(record._id, 'reject')}
          >
            Từ chối
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: 24 }}>
        <div className="br-header">
          <h2>Yêu cầu mượn thiết bị</h2>
          <div className="br-header-actions">
            <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
              Tải lại
            </Button>
            <Button type="link" onClick={() => navigate('/school-dashboard')}>
              Về dashboard
            </Button>
          </div>
        </div>
        <Table
          rowKey={(r) => r._id}
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={{ pageSize: 10 }}
        />
      </Content>
    </Layout>
  );
};

export default BorrowRequests;
