import React, { useState, useEffect } from "react";
import {
    Table, Tabs, Button, Tag, Space, Modal, Form, Input,
    Select, DatePicker, notification, Popconfirm, Tooltip, Card, Row, Col,
    Descriptions, Avatar, Typography, Divider // <--- Đã thêm đủ import
} from "antd";
import {
    EyeOutlined, EditOutlined, DeleteOutlined,
    CheckCircleOutlined, UserOutlined, ReloadOutlined, SearchOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
    getActiveStudents,
    getPendingStudents,
    updateStudent,
    softDeleteStudent,
    approveStudents
} from "../../services/userService";

const { Option } = Select;
const { Search } = Input;
const { Title, Text } = Typography; // <--- QUAN TRỌNG: Phải có dòng này mới dùng được <Title>

const StudentManagerPage = () => {
    // --- STATE DỮ LIỆU ---
    const [activeStudents, setActiveStudents] = useState([]);
    const [pendingStudents, setPendingStudents] = useState([]);
    const [loading, setLoading] = useState(false);

    // State tìm kiếm
    const [searchText, setSearchText] = useState("");

    // State Modal & Form
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [form] = Form.useForm();

    // State View Detail
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingStudent, setViewingStudent] = useState(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);

    // --- LOAD DỮ LIỆU ---
    const fetchData = async () => {
        setLoading(true);
        try {
            const activeRes = await getActiveStudents();
            const pendingRes = await getPendingStudents();

            const activeList = activeRes.data || activeRes || [];
            const pendingList = pendingRes.data || pendingRes || [];

            setActiveStudents(activeList);
            setPendingStudents(pendingList);
        } catch (error) {
            notification.error({ message: "Lỗi tải dữ liệu", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- LỌC DỮ LIỆU ---
    const getFilteredData = (data) => {
        if (!searchText) return data;
        const lowerText = searchText.toLowerCase();
        return data.filter(item =>
            (item.name && item.name.toLowerCase().includes(lowerText)) ||
            (item.student_code && item.student_code.toLowerCase().includes(lowerText)) ||
            (item.email && item.email.toLowerCase().includes(lowerText))
        );
    };

    // --- ACTIONS ---
    const handleEditClick = (record) => {
        form.resetFields();
        setEditingStudent(record);
        form.setFieldsValue({
            ...record,
            date_of_birth: record.date_of_birth ? dayjs(record.date_of_birth) : null,
            phone: record.phone || "",
            address: record.address || "",
            gender: record.gender || "Other",
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateSubmit = async (values) => {
        try {
            const submitData = {
                ...values,
                date_of_birth: values.date_of_birth ? values.date_of_birth.toISOString() : null,
            };
            await updateStudent(editingStudent._id, submitData);
            notification.success({ message: "Cập nhật thành công!" });
            setIsEditModalOpen(false);
            fetchData();
        } catch (error) {
            notification.error({
                message: "Cập nhật thất bại",
                description: error.response?.data?.message || error.message
            });
        }
    };

    const handleDeleteClick = async (id) => {
        try {
            await softDeleteStudent(id);
            notification.success({ message: "Đã hủy kích hoạt sinh viên" });
            fetchData();
        } catch (error) {
            notification.error({ message: "Lỗi", description: error.message });
        }
    };

    const handleViewClick = (record) => {
        setViewingStudent(record);
        setIsViewModalOpen(true);
    };

    const handleApproveSelected = async () => {
        if (selectedRowKeys.length === 0) return;
        try {
            setLoading(true);
            await approveStudents(selectedRowKeys);
            notification.success({
                message: "Phê duyệt thành công",
                description: `Đã cấp quyền cho ${selectedRowKeys.length} sinh viên.`
            });
            setSelectedRowKeys([]);
            fetchData();
        } catch (error) {
            notification.error({ message: "Lỗi phê duyệt", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    // --- CONFIG BẢNG ---
    const paginationConfig = {
        defaultPageSize: 10,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50'],
        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} sinh viên`,
    };

    const activeColumns = [
        { title: 'STT', key: 'index', width: 60, render: (_, __, index) => index + 1 },
        { title: 'Họ và tên', dataIndex: 'name', key: 'name', render: (text) => <b>{text}</b> },
        { title: 'MSSV', dataIndex: 'student_code', key: 'student_code', render: (text) => <Tag color="blue">{text}</Tag> },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        {
            title: 'Trạng thái', dataIndex: 'isActive', key: 'isActive',
            render: (active) => (active ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>)
        },
        {
            title: 'Thao tác', key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Xem chi tiết"><Button icon={<EyeOutlined />} onClick={() => handleViewClick(record)} /></Tooltip>
                    <Tooltip title="Cập nhật"><Button type="primary" icon={<EditOutlined />} onClick={() => handleEditClick(record)} /></Tooltip>
                    <Tooltip title="Hủy kích hoạt">
                        <Popconfirm title="Bạn có chắc chắn muốn hủy kích hoạt?" onConfirm={() => handleDeleteClick(record._id)} okText="Đồng ý" cancelText="Hủy">
                            <Button type="primary" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const pendingColumns = [
        { title: 'STT', key: 'index', width: 60, render: (_, __, index) => index + 1 },
        { title: 'Họ và tên', dataIndex: 'name', key: 'name', render: (text) => <b>{text}</b> },
        { title: 'MSSV', dataIndex: 'student_code', key: 'student_code', render: (text) => <Tag color="orange">{text}</Tag> },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        { title: 'Ngày đăng ký', dataIndex: 'createdAt', key: 'createdAt', render: (date) => new Date(date).toLocaleDateString('vi-VN') }
    ];

    // --- RENDER ---
    const filteredActive = getFilteredData(activeStudents || []);
    const filteredPending = getFilteredData(pendingStudents || []);

    const items = [
        {
            key: '1',
            label: <span><UserOutlined /> Danh sách sinh viên ({activeStudents?.length || 0})</span>,
            children: (
                <Table
                    columns={activeColumns}
                    dataSource={filteredActive}
                    rowKey="_id"
                    loading={loading}
                    pagination={paginationConfig}
                />
            ),
        },
        {
            key: '2',
            label: <span><CheckCircleOutlined /> Xác thực sinh viên ({pendingStudents?.length || 0})</span>,
            children: (
                <div>
                    <div style={{ marginBottom: 16, display: 'flex', gap: 10 }}>
                        <Button
                            type="primary"
                            onClick={handleApproveSelected}
                            disabled={!selectedRowKeys.length}
                            loading={loading}
                            style={{ backgroundColor: selectedRowKeys.length ? '#52c41a' : undefined }}
                        >
                            Phê duyệt đã chọn ({selectedRowKeys.length})
                        </Button>
                        <Button icon={<ReloadOutlined />} onClick={fetchData}>Làm mới</Button>
                    </div>
                    <Table
                        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
                        columns={pendingColumns}
                        dataSource={filteredPending}
                        rowKey="_id"
                        loading={loading}
                        pagination={paginationConfig}
                    />
                </div>
            ),
        },
    ];

    return (
        <div style={{ padding: '20px' }}>
            <Card title="Quản lý Sinh viên" bordered={false}>
                <Row style={{ marginBottom: 20 }}>
                    <Col span={8}>
                        <Search
                            placeholder="Tìm theo Tên, MSSV hoặc Email..."
                            allowClear
                            enterButton={<SearchOutlined />}
                            size="large"
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </Col>
                </Row>

                <Tabs defaultActiveKey="1" items={items} />
            </Card>

            {/* --- MODAL EDIT --- */}
            <Modal
                title="Cập nhật thông tin"
                open={isEditModalOpen}
                onCancel={() => setIsEditModalOpen(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleUpdateSubmit}>
                    <Form.Item label="Họ và tên" name="name" rules={[
                        { required: true, message: "Nhập họ tên!" },
                        { min: 4, message: "Họ và tên phải tối thiểu 4 ký tự" },
                        { pattern: /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s\u00C0-\u1EF9]+$/, message: "Chỉ chứa chữ và khoảng trắng" }
                    ]}><Input /></Form.Item>

                    <Form.Item label="MSSV" name="student_code" rules={[
                        { required: true, message: "Nhập mã sinh viên" },
                        { len: 8, message: "Đúng 8 ký tự" },
                        { pattern: /^[a-zA-Z0-9]+$/, message: "Chữ và số, không dấu" }
                    ]}><Input maxLength={8} /></Form.Item>

                    <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>

                    <Form.Item label="Tên đăng nhập" name="username" rules={[
                        { required: true, message: "Nhập username" },
                        { min: 3, max: 20, message: "Từ 3-20 ký tự" },
                        { pattern: /^[a-zA-Z0-9_]+$/, message: "Không chứa dấu, khoảng trắng" }
                    ]}><Input /></Form.Item>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Form.Item label="Giới tính" name="gender" style={{ flex: 1 }}>
                            <Select><Option value="Male">Nam</Option><Option value="Female">Nữ</Option><Option value="Other">Khác</Option></Select>
                        </Form.Item>
                        <Form.Item label="Ngày sinh" name="date_of_birth" style={{ flex: 1 }}>
                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                        </Form.Item>
                    </div>

                    <Form.Item label="SĐT" name="phone" rules={[
                        { pattern: /(84|0[3|5|7|8|9])+([0-9]{8})\b/, message: 'SĐT không hợp lệ' }
                    ]}><Input /></Form.Item>

                    <Form.Item label="Địa chỉ" name="address"><Input.TextArea /></Form.Item>

                    <div style={{ textAlign: 'right' }}>
                        <Button onClick={() => setIsEditModalOpen(false)} style={{ marginRight: 8 }}>Hủy</Button>
                        <Button type="primary" htmlType="submit" loading={loading}>Lưu</Button>
                    </div>
                </Form>
            </Modal>

            {/* --- MODAL VIEW DETAIL (FIX LỖI TRANG TRẮNG) --- */}
            <Modal
                title={null}
                open={isViewModalOpen}
                onCancel={() => setIsViewModalOpen(false)}
                footer={null}
                width={800}
                centered
            >
                {viewingStudent && (
                    <div style={{ padding: '20px 10px' }}>
                        {/* 1. Header: Avatar & Tên */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
                            <Avatar
                                size={80}
                                icon={<UserOutlined />}
                                style={{ backgroundColor: '#1890ff', marginBottom: 10 }}
                                src={viewingStudent.avatar}
                            />
                            {/* Đã có khai báo Title, Text ở trên cùng nên sẽ không lỗi */}
                            <Title level={3} style={{ margin: 0 }}>{viewingStudent.name}</Title>
                            <Text type="secondary">{viewingStudent.email}</Text>
                            <div style={{ marginTop: 8 }}>
                                <Tag color="blue">Sinh viên</Tag>
                                {viewingStudent.isActive ?
                                    <Tag color="success">Đang hoạt động</Tag> :
                                    <Tag color="error">Ngừng hoạt động</Tag>
                                }
                            </div>
                        </div>

                        {/* 2. Bảng thông tin */}
                        <Descriptions title="Thông tin chi tiết" bordered column={2}>
                            <Descriptions.Item label="Họ và tên">{viewingStudent.name}</Descriptions.Item>
                            <Descriptions.Item label="Mã số sinh viên (MSSV)">
                                <b style={{ color: '#1890ff' }}>{viewingStudent.student_code}</b>
                            </Descriptions.Item>

                            <Descriptions.Item label="Tên đăng nhập">{viewingStudent.username}</Descriptions.Item>
                            <Descriptions.Item label="Giới tính">{viewingStudent.gender}</Descriptions.Item>

                            <Descriptions.Item label="Email">{viewingStudent.email}</Descriptions.Item>
                            <Descriptions.Item label="Số điện thoại">{viewingStudent.phone || "Chưa cập nhật"}</Descriptions.Item>

                            <Descriptions.Item label="Ngày sinh">
                                {viewingStudent.date_of_birth ? new Date(viewingStudent.date_of_birth).toLocaleDateString('vi-VN') : "Chưa cập nhật"}
                            </Descriptions.Item>

                            <Descriptions.Item label="Ngày tạo tài khoản">
                                {/* Thêm check tồn tại để tránh crash nếu dữ liệu cũ không có createdAt */}
                                {viewingStudent.createdAt ? new Date(viewingStudent.createdAt).toLocaleDateString('vi-VN') : "Không có dữ liệu"}
                            </Descriptions.Item>

                            <Descriptions.Item label="Địa chỉ" span={2}>
                                {viewingStudent.address || "Chưa cập nhật"}
                            </Descriptions.Item>
                        </Descriptions>

                        <div style={{ textAlign: 'center', marginTop: 24 }}>
                            <Button type="primary" onClick={() => setIsViewModalOpen(false)}>
                                Đóng
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default StudentManagerPage;