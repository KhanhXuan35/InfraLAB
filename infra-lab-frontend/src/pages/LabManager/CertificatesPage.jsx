import React, { useEffect, useState } from 'react';
import { Layout, Table, Tag, Button, message, Modal, Descriptions, Space, Typography, Divider, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  EyeOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import api from '../../services/api';
import LabManagerSidebar from '../../components/Sidebar/LabManagerSidebar';

const { Text, Title } = Typography;
const { Content } = Layout;

const CertificatesPage = () => {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/certificates');
      setCertificates(Array.isArray(res) ? res : res?.data || []);
    } catch (err) {
      message.error(err?.message || 'Không lấy được danh sách chứng nhận');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (record) => {
    try {
      const res = await api.get(`/certificates/${record._id}`);
      setSelectedCertificate(res?.data || record);
      setDetailModalVisible(true);
    } catch (err) {
      message.error(err?.message || 'Không lấy được chi tiết chứng nhận');
      // Fallback: dùng dữ liệu từ list
      setSelectedCertificate(record);
      setDetailModalVisible(true);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const columns = [
    {
      title: 'Mã chứng nhận',
      dataIndex: 'certificate_code',
      width: 200,
      render: (code) => <Text code>{code}</Text>,
    },
    {
      title: 'Thiết bị',
      dataIndex: 'device_id',
      render: (dev) => dev?.name || 'N/A',
    },
    {
      title: 'Số lượng',
      dataIndex: 'qty',
      width: 100,
      align: 'center',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 120,
      render: (status) => {
        const map = {
          APPROVED: { color: 'green', label: 'Đã duyệt' },
          REJECTED: { color: 'red', label: 'Từ chối' },
        };
        const cfg = map[status] || { color: 'default', label: status || 'N/A' };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: 'Người duyệt',
      dataIndex: 'approver_name',
      render: (name, record) => name || record.approver_id?.name || 'N/A',
    },
    {
      title: 'Thời gian',
      dataIndex: 'approved_at',
      render: (date, record) => {
        const time = date || record.rejected_at || record.createdAt;
        return time ? new Date(time).toLocaleString('vi-VN') : '-';
      },
    },
    {
      title: 'Hành động',
      dataIndex: '_id',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            Xem
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <LabManagerSidebar />
      <Layout style={{ marginLeft: 240 }}>
        <Content style={{ padding: '24px', background: '#f0f2f5' }}>
          <Card>
            <Title level={3}>Chứng nhận mượn thiết bị</Title>
            <Table
              rowKey="_id"
              loading={loading}
              columns={columns}
              dataSource={certificates}
              pagination={{ pageSize: 10 }}
            />
          </Card>

          {/* Modal chi tiết chứng nhận */}
          <Modal
            title={
              <Space>
                <span>ĐƠN MƯỢN THIẾT BỊ</span>
                <Button
                  type="primary"
                  icon={<PrinterOutlined />}
                  onClick={handlePrint}
                  style={{ marginLeft: 'auto' }}
                >
                  In đơn
                </Button>
              </Space>
            }
            open={detailModalVisible}
            onCancel={() => {
              setDetailModalVisible(false);
              setSelectedCertificate(null);
            }}
            footer={null}
            width={800}
            className="certificate-modal"
          >
            {selectedCertificate && (
              <div className="certificate-content" style={{ padding: '20px' }}>
                <Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
                  ĐƠN MƯỢN THIẾT BỊ
                </Title>

                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Mã đơn">
                    <Text code>{selectedCertificate.request_id?._id || selectedCertificate._id}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Mã chứng nhận">
                    <Text code>{selectedCertificate.certificate_code}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Người yêu cầu">
                    {selectedCertificate.requester_name} ({selectedCertificate.requester_email})
                  </Descriptions.Item>
                  <Descriptions.Item label="Vai trò">
                    <Tag color="blue">Lab Manager</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Thời gian yêu cầu">
                    {selectedCertificate.createdAt
                      ? new Date(selectedCertificate.createdAt).toLocaleString('vi-VN')
                      : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Thiết bị">
                    <Space>
                      {selectedCertificate.device_id?.image && (
                        <img
                          src={selectedCertificate.device_id.image}
                          alt={selectedCertificate.device_id.name}
                          style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
                        />
                      )}
                      <span>{selectedCertificate.device_id?.name || 'N/A'}</span>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Số lượng">
                    {selectedCertificate.qty}
                  </Descriptions.Item>
                  <Descriptions.Item label="Trạng thái">
                    <Tag color={selectedCertificate.status === 'APPROVED' ? 'green' : 'red'}>
                      {selectedCertificate.status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'}
                    </Tag>
                  </Descriptions.Item>
                  {selectedCertificate.status === 'APPROVED' && (
                    <>
                      <Descriptions.Item label="Người duyệt">
                        {selectedCertificate.approver_name || 'N/A'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Thời gian duyệt">
                        {selectedCertificate.approved_at
                          ? new Date(selectedCertificate.approved_at).toLocaleString('vi-VN')
                          : '-'}
                      </Descriptions.Item>
                      {selectedCertificate.device_instance_ids && selectedCertificate.device_instance_ids.length > 0 && (
                        <Descriptions.Item label="Serial Numbers đã cấp">
                          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                            {selectedCertificate.device_instance_ids.map((inst, idx) => (
                              <Tag key={idx} style={{ marginBottom: 4 }}>
                                {inst.serial_number || inst._id}
                              </Tag>
                            ))}
                          </div>
                        </Descriptions.Item>
                      )}
                    </>
                  )}
                  {selectedCertificate.status === 'REJECTED' && (
                    <>
                      <Descriptions.Item label="Người từ chối">
                        {selectedCertificate.approver_name || 'N/A'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Thời gian từ chối">
                        {selectedCertificate.rejected_at
                          ? new Date(selectedCertificate.rejected_at).toLocaleString('vi-VN')
                          : '-'}
                      </Descriptions.Item>
                    </>
                  )}
                </Descriptions>

                {selectedCertificate.note && (
                  <>
                    <Divider />
                    <div style={{ padding: '12px', background: '#fff7e6', borderRadius: 4, marginTop: 16 }}>
                      <Text strong>Lưu ý:</Text>
                      <div style={{ marginTop: 8 }}>
                        <Text>{selectedCertificate.note}</Text>
                      </div>
                    </div>
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

export default CertificatesPage;

