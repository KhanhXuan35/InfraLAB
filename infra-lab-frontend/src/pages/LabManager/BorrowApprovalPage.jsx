import React, { useEffect, useState } from "react";
import { Layout, Card, Table, Tag, Space, Button, Typography, Modal, Descriptions, message, Image, Popover, Row, Col, Divider } from "antd";
import {
  UserOutlined,
  ShoppingOutlined,
  CheckOutlined,
  CloseOutlined,
  FileTextOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../services/api";
import LabManagerSidebar from "../../components/Sidebar/LabManagerSidebar";

const { Content } = Layout;
const { Title, Text } = Typography;

const BorrowApprovalPage = () => {
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [deviceDetails, setDeviceDetails] = useState({}); // Lưu thông tin chi tiết thiết bị
  const [loadingDeviceDetails, setLoadingDeviceDetails] = useState({});
  const [deviceInstances, setDeviceInstances] = useState({}); // Lưu thông tin DeviceInstance (serial numbers)

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await api.get("/lab-manager/borrow-requests/pending");
      if (res.success) {
        setRequests(res.data || []);
      } else {
        message.error(res.message || "Không thể tải danh sách yêu cầu mượn");
      }
    } catch (err) {
      console.error("fetchPending error:", err);
      message.error(err.message || "Lỗi khi tải danh sách yêu cầu mượn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (record) => {
    Modal.confirm({
      title: "Phê duyệt và giao thiết bị?",
      content:
        "Hệ thống sẽ tự động chọn các thiết bị khả dụng trong Lab theo số serial tăng dần và gán cho sinh viên.",
      okText: "Phê duyệt",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const res = await api.post(
            `/lab-manager/borrow-requests/${record._id}/approve-and-assign`,
            {}
          );
          if (res.success) {
            message.success("Đã phê duyệt và phân bổ thiết bị thành công");
            fetchPending();
          } else {
            message.error(res.message || "Không thể phê duyệt yêu cầu");
          }
        } catch (err) {
          console.error("approve error:", err);
          message.error(err.message || "Lỗi khi phê duyệt yêu cầu");
        }
      },
    });
  };

  const openRejectModal = (record) => {
    setSelectedRequest(record);
    setRejectReason("");
    setRejectModalVisible(true);
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    try {
      const res = await api.post(
        `/lab-manager/borrow-requests/${selectedRequest._id}/reject`,
        { reason: rejectReason || "Không đủ điều kiện" }
      );
      if (res.success) {
        message.success("Đã từ chối yêu cầu mượn");
        setRejectModalVisible(false);
        setSelectedRequest(null);
        fetchPending();
      } else {
        message.error(res.message || "Không thể từ chối yêu cầu");
      }
    } catch (err) {
      console.error("reject error:", err);
      message.error(err.message || "Lỗi khi từ chối yêu cầu");
    }
  };

  const openDetail = async (record) => {
    setSelectedRequest(record);
    setDetailVisible(true);
    
    // Clear cache để đảm bảo lấy dữ liệu mới nhất
    setDeviceDetails({});
    
    // Load thông tin chi tiết và tồn kho cho từng thiết bị
    if (record.items && record.items.length > 0) {
      const deviceIds = record.items.map(item => item.device_id?._id || item.device_id);
      await fetchDeviceDetails(deviceIds);
      
      // Nếu đơn đã được phê duyệt, load thông tin DeviceInstance (serial numbers)
      if (record.status === 'borrowed' && record.items) {
        await fetchDeviceInstances(record.items);
      }
    }
  };

  const fetchDeviceInstances = async (items) => {
    const instancesMap = {};
    
    for (const item of items) {
      if (item.device_instances && item.device_instances.length > 0) {
        // Nếu backend đã populate device_instances, dùng trực tiếp
        const instances = item.device_instances.map(inst => {
          // Nếu đã là object có serial_number, dùng luôn
          if (inst.serial_number) {
            return inst;
          }
          // Nếu chỉ là ObjectId, cần fetch thêm
          return null;
        }).filter(inst => inst !== null);
        
        const deviceId = item.device_id?._id || item.device_id;
        
        // Nếu đã có đủ thông tin từ populate, dùng luôn
        if (instances.length > 0) {
          instancesMap[deviceId] = instances;
        } else {
          // Nếu chưa có, fetch từ API
          const instanceIds = item.device_instances.map(inst => inst._id || inst);
          try {
            const instancePromises = instanceIds.map(async (instanceId) => {
              try {
                const res = await api.get(`/device-instances/${instanceId}/summary`);
                if (res.success && res.data?.instance) {
                  return res.data.instance;
                }
              } catch (err) {
                console.error(`Error fetching instance ${instanceId}:`, err);
              }
              return null;
            });
            
            const fetchedInstances = await Promise.all(instancePromises);
            instancesMap[deviceId] = fetchedInstances.filter(inst => inst !== null);
          } catch (err) {
            console.error(`Error fetching instances for device ${deviceId}:`, err);
          }
        }
      }
    }
    
    setDeviceInstances({ ...deviceInstances, ...instancesMap });
  };

  const fetchDeviceDetails = async (deviceIds) => {
    const details = {};
    const loading = {};
    
    for (const deviceId of deviceIds) {
      if (!deviceId) continue;
      loading[deviceId] = true;
      setLoadingDeviceDetails({ ...loadingDeviceDetails, ...loading });
      
      try {
        // Thêm timestamp để tránh cache
        const timestamp = new Date().getTime();
        const res = await api.get(`/devices/${deviceId}?location=lab&_t=${timestamp}`);
        if (res.success && res.data) {
          details[deviceId] = res.data;
        }
      } catch (err) {
        console.error(`Error fetching device ${deviceId}:`, err);
      } finally {
        loading[deviceId] = false;
        setLoadingDeviceDetails({ ...loadingDeviceDetails, ...loading });
      }
    }
    
    setDeviceDetails({ ...deviceDetails, ...details });
  };

  const getDeviceDetail = (deviceId) => {
    return deviceDetails[deviceId] || null;
  };

  const renderDevicePopover = (item) => {
    const deviceId = item.device_id?._id || item.device_id;
    const detail = getDeviceDetail(deviceId);
    const isLoading = loadingDeviceDetails[deviceId];
    
    if (!detail && !isLoading) {
      return <span>{item.device_id?.name || "N/A"}</span>;
    }
    
    const content = (
      <div style={{ maxWidth: 300 }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <Text type="secondary">Đang tải...</Text>
          </div>
        ) : detail ? (
          <>
            {detail.image && (
              <div style={{ marginBottom: 12, textAlign: 'center' }}>
                <Image
                  src={detail.image}
                  alt={detail.name}
                  width={120}
                  height={120}
                  style={{ objectFit: 'cover', borderRadius: 8 }}
                  fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4="
                />
              </div>
            )}
            <Divider style={{ margin: '8px 0' }} />
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Tên thiết bị">
                <Text strong>{detail.name}</Text>
              </Descriptions.Item>
              {detail.category && (
                <Descriptions.Item label="Danh mục">
                  {detail.category.name}
                </Descriptions.Item>
              )}
              {detail.inventory && (
                <>
                  <Descriptions.Item label="Tồn kho Lab">
                    <Text strong style={{ color: detail.inventory.available > 0 ? '#52c41a' : '#ff4d4f' }}>
                      {detail.inventory.available || 0} / {detail.inventory.total || 0}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Đang mượn">
                    {detail.inventory.borrowed || 0}
                  </Descriptions.Item>
                  <Descriptions.Item label="Đang hỏng">
                    {detail.inventory.broken || 0}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>
          </>
        ) : (
          <Text type="secondary">Không tìm thấy thông tin</Text>
        )}
      </div>
    );
    
    return (
      <Popover content={content} title="Thông tin chi tiết thiết bị" trigger="click">
        <Button type="link" style={{ padding: 0, height: 'auto' }}>
          <Space>
            {detail?.image && (
              <Image
                src={detail.image}
                alt={detail.name}
                width={32}
                height={32}
                style={{ objectFit: 'cover', borderRadius: 4 }}
                preview={false}
                fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4="
              />
            )}
            <span>{item.device_id?.name || "N/A"}</span>
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
          </Space>
        </Button>
      </Popover>
    );
  };

  const columns = [
    {
      title: "Mã yêu cầu",
      dataIndex: "_id",
      key: "_id",
      render: (id) => <Text code>{id.toString().slice(-8)}</Text>,
    },
    {
      title: "Sinh viên",
      dataIndex: "student_id",
      key: "student",
      render: (stu) => (
        <Space>
          <UserOutlined />
          <div>
            <Text strong>{stu?.name || "N/A"}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {stu?.student_code || stu?.email || ""}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Số loại thiết bị",
      dataIndex: "items",
      key: "items",
      render: (items) => `${items?.length || 0} loại`,
    },
    {
      title: "Hẹn trả",
      dataIndex: "return_due_date",
      key: "return_due_date",
      render: (date) => (
        <Space>
          <CalendarOutlined />
          <span>{dayjs(date).format("DD/MM/YYYY")}</span>
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag color="orange">Chờ duyệt</Tag>,
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <Button onClick={() => openDetail(record)}>Chi tiết</Button>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <LabManagerSidebar />
      <Layout style={{ marginLeft: 240 }}>
        <Content style={{ margin: "24px", minHeight: 280 }}>
          <div style={{ marginBottom: 24 }}>
            <Title level={2} style={{ margin: 0, marginBottom: 8 }}>
              Duyệt yêu cầu mượn thiết bị
            </Title>
            <Text type="secondary">
              Xem danh sách yêu cầu mượn từ sinh viên và phê duyệt giao thiết bị.
            </Text>
          </div>
          <Card>
            <Table
              rowKey={(r) => r._id}
              loading={loading}
              columns={columns}
              dataSource={requests}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Tổng ${total} yêu cầu`,
              }}
            />
          </Card>

          <Modal
            open={detailVisible}
            onCancel={() => {
              setDetailVisible(false);
              setSelectedRequest(null);
            }}
            title={
              <Space>
                <FileTextOutlined />
                <span>Chi tiết yêu cầu mượn</span>
              </Space>
            }
            footer={[
              <Button
                key="close"
                onClick={() => {
                  setDetailVisible(false);
                  setSelectedRequest(null);
                }}
              >
                Đóng
              </Button>,
              <Button
                key="reject"
                danger
                icon={<CloseOutlined />}
                onClick={() => {
                  setDetailVisible(false);
                  openRejectModal(selectedRequest);
                }}
              >
                Từ chối
              </Button>,
              <Button
                key="approve"
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => {
                  setDetailVisible(false);
                  handleApprove(selectedRequest);
                }}
              >
                Phê duyệt
              </Button>,
            ]}
            width={800}
          >
            {selectedRequest && (
              <>
                <Descriptions
                  title="Thông tin sinh viên"
                  bordered
                  size="small"
                  column={2}
                  style={{ marginBottom: 16 }}
                >
                  <Descriptions.Item label="Họ tên">
                    {selectedRequest.student_id?.name || "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Mã sinh viên">
                    {selectedRequest.student_id?.student_code || "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">
                    {selectedRequest.student_id?.email || "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số điện thoại">
                    {selectedRequest.student_id?.phone || "N/A"}
                  </Descriptions.Item>
                </Descriptions>

                <Descriptions
                  title="Thông tin mượn"
                  bordered
                  size="small"
                  column={1}
                  style={{ marginBottom: 16 }}
                >
                  <Descriptions.Item label="Mã yêu cầu">
                    <Text code>{selectedRequest._id.toString()}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày hẹn trả">
                    {dayjs(selectedRequest.return_due_date).format("DD/MM/YYYY")}
                  </Descriptions.Item>
                  <Descriptions.Item label="Mục đích sử dụng">
                    {selectedRequest.purpose || "N/A"}
                  </Descriptions.Item>
                  {selectedRequest.notes && (
                    <Descriptions.Item label="Ghi chú">
                      {selectedRequest.notes}
                    </Descriptions.Item>
                  )}
                </Descriptions>

                <Title level={5} style={{ marginTop: 16 }}>
                  {selectedRequest.status === 'borrowed' 
                    ? 'Danh sách thiết bị đã giao' 
                    : 'Danh sách thiết bị yêu cầu'}
                </Title>
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                  {selectedRequest.items?.map((item, idx) => {
                    const deviceId = item.device_id?._id || item.device_id;
                    const detail = getDeviceDetail(deviceId);
                    const inventory = detail?.inventory;
                    const assignedInstances = deviceInstances[deviceId] || [];
                    
                    return (
                      <Col xs={24} sm={12} key={idx}>
                        <Card
                          size="small"
                          hoverable
                          style={{ cursor: 'pointer' }}
                          bodyStyle={{ padding: 12 }}
                        >
                          <Space align="start" style={{ width: '100%' }} direction="vertical" size="small">
                            <Space align="start" style={{ width: '100%' }}>
                              {detail?.image ? (
                                <Image
                                  src={detail.image}
                                  alt={item.device_id?.name}
                                  width={60}
                                  height={60}
                                  style={{ objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                                  fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4="
                                />
                              ) : (
                                <div
                                  style={{
                                    width: 60,
                                    height: 60,
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: 4,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  <ShoppingOutlined style={{ fontSize: 24, color: '#d9d9d9' }} />
                                </div>
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ marginBottom: 4 }}>
                                  {renderDevicePopover(item)}
                                </div>
                                {detail?.category && (
                                  <div style={{ marginBottom: 4 }}>
                                    <Tag color="blue" style={{ fontSize: 11 }}>
                                      {detail.category.name}
                                    </Tag>
                                  </div>
                                )}
                                <div style={{ marginBottom: 4 }}>
                                  <Text strong>Số lượng yêu cầu: </Text>
                                  <Text>{item.quantity}</Text>
                                </div>
                                {inventory && selectedRequest.status !== 'borrowed' && (
                                  <div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                      Tồn kho Lab:{" "}
                                      <Text
                                        strong
                                        style={{
                                          color: inventory.available >= item.quantity ? '#52c41a' : '#ff4d4f',
                                        }}
                                      >
                                        {inventory.available || 0}
                                      </Text>
                                      {" / "}
                                      <Text type="secondary">{inventory.total || 0}</Text>
                                    </Text>
                                  </div>
                                )}
                              </div>
                            </Space>
                            
                            {/* Hiển thị mã serial nếu đã được gán */}
                            {selectedRequest.status === 'borrowed' && assignedInstances.length > 0 && (
                              <div style={{ width: '100%', marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
                                <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                                  Mã serial đã giao:
                                </Text>
                                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                  {assignedInstances.map((instance, instIdx) => (
                                    <Text code key={instIdx} style={{ fontSize: 11 }}>
                                      {instance.serial_number || instance._id?.toString().slice(-8) || 'N/A'}
                                    </Text>
                                  ))}
                                </Space>
                              </div>
                            )}
                            
                            {/* Hiển thị thông báo nếu chưa được gán nhưng đã phê duyệt */}
                            {selectedRequest.status === 'borrowed' && assignedInstances.length === 0 && (
                              <div style={{ width: '100%', marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  Đang tải thông tin serial...
                                </Text>
                              </div>
                            )}
                          </Space>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              </>
            )}
          </Modal>

          <Modal
            open={rejectModalVisible}
            title="Từ chối yêu cầu mượn"
            okText="Xác nhận"
            cancelText="Hủy"
            onOk={handleReject}
            onCancel={() => {
              setRejectModalVisible(false);
              setSelectedRequest(null);
            }}
          >
            <p>Bạn có chắc chắn muốn từ chối yêu cầu mượn này?</p>
            <Text type="secondary">Lý do (tùy chọn):</Text>
            <textarea
              style={{ width: "100%", marginTop: 8, minHeight: 80 }}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối (nếu có)..."
            />
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default BorrowApprovalPage;


