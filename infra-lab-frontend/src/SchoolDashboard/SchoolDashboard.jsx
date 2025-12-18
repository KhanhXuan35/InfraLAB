import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Card,
  Table,
  Input,
  Select,
  Button,
  Space,
  Tag,
  Typography,
  message,
  Popconfirm,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../services/api';
import SchoolAdminSidebar from '../components/Sidebar/SchoolAdminSidebar';

const { Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

function SchoolDashboard() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const [sortState, setSortState] = useState({}); // Track sort state for each column

  useEffect(() => {
    loadData();
  }, []);

  // --- LOAD DATA ---
  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, devRes, invRes] = await Promise.all([
        api.get('/device-categories'),
        api.get('/devices?location=warehouse'),
        api.get('/inventories'),
      ]);

      setCategories(catRes?.data || []);
      // Sắp xếp theo bảng chữ cái khi tải dữ liệu ban đầu
      const sortedDevices = (devRes?.data || []).sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB, 'vi');
      });
      setDevices(sortedDevices);
      setInventories(invRes?.data || []);
    } catch (err) {
      console.error('Load data error:', err);
      setError(err.message || 'Không thể tải dữ liệu');
      message.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const filteredDevices = useMemo(() => {
    if (!Array.isArray(devices)) return [];

    let list = devices.filter((item) => {
      if (!item) return false;

      const nameMatches = (item.name || '')
        .toLowerCase()
        .includes((search || '').toLowerCase().trim());

      const catField = item.category_id ?? item.category;
      const deviceCategoryId =
        catField && typeof catField === 'object'
          ? catField._id ?? catField
          : catField;

      const normalizedDeviceCategoryId = deviceCategoryId
        ? String(deviceCategoryId).trim().toLowerCase()
        : '';
      const normalizedSelectedCategory = selectedCategory
        ? String(selectedCategory).trim().toLowerCase()
        : '';

      const categoryMatches =
        selectedCategory === 'all' ||
        (normalizedDeviceCategoryId &&
          normalizedDeviceCategoryId === normalizedSelectedCategory);

      return nameMatches && categoryMatches;
    });

    // Sắp xếp theo bảng chữ cái khi không có filter nào được chọn
    const hasNoFilters = !search.trim() && selectedCategory === 'all';
    if (hasNoFilters) {
      list = list.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB, 'vi');
      });
    } else {
      // Sort theo sort option khi có filter
      list = list.sort((a, b) => {
        if (sort === 'newest') {
          return new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id);
        }
        return new Date(a.createdAt || a._id) - new Date(b.createdAt || b._id);
      });
    }

    return list;
  }, [devices, search, selectedCategory, sort]);

  const handleDelete = async (device) => {
    try {
      const devId = device._id || device.id;
      await api.delete(`/devices/${devId}`);
      message.success('Đã xóa thiết bị thành công');
      await loadData();
    } catch (error) {
      console.error('Delete device error:', error);
      message.error(error.message || 'Không thể xóa thiết bị');
    }
  };

  const getInventoryInfo = (device) => {
    const devId = device._id || device.id || '';
    const inv = inventories.find((i) => {
      const iDev = i.device_id?._id || i.device_id || '';
      return String(iDev) === String(devId);
    });
    const total = inv?.total ?? 0;
    const available = inv?.available ?? 0;
    const broken = inv?.broken ?? 0;
    const borrowing = Math.max(total - available - broken, 0);
    return { total, available, broken, borrowing };
  };

  const getCategoryName = (device) => {
    const catField = device.category_id ?? device.category;
    if (catField && typeof catField === 'object' && catField.name) {
      return catField.name;
    }
    const catId = catField?._id || catField;
    const found = categories.find((cat) => String(cat._id) === String(catId));
    return found?.name || 'N/A';
  };

  // Recreate columns when sortState changes to ensure sorter functions have access to latest state
  const columns = useMemo(() => [
    {
      title: '#',
      key: 'index',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Ảnh',
      key: 'image',
      width: 80,
      render: (_, record) => (
        record.image ? (
          <img
            src={record.image}
            alt={record.name}
            style={{
              width: 50,
              height: 50,
              objectFit: 'cover',
              borderRadius: 4,
            }}
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/50?text=No+Image';
            }}
          />
        ) : (
          <div style={{
            width: 50,
            height: 50,
            backgroundColor: '#f0f0f0',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            color: '#999',
          }}>
            No Image
          </div>
        )
      ),
    },
    {
      title: 'Tên Thiết Bị',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Danh Mục',
      key: 'category',
      render: (_, record) => <Tag color="blue">{getCategoryName(record)}</Tag>,
    },
    {
      title: 'Ngày Nhập',
      key: 'createdAt',
      width: 140,
      render: (_, record) => {
        const date = record.createdAt || record.created_at;
        if (!date) return <span>-</span>;
        return (
          <span style={{ fontSize: '13px' }}>
            {dayjs(date).format('DD/MM/YYYY')}
          </span>
        );
      },
      sorter: (a, b) => {
        const dateA = new Date(a.createdAt || a.created_at || 0);
        const dateB = new Date(b.createdAt || b.created_at || 0);
        // Mũi tên lên (ascend) = cao → thấp (mới → cũ)
        // Mũi tên xuống (descend) = thấp → cao (cũ → mới)
        const order = sortState['createdAt'];
        if (order === 'ascend') return dateB - dateA; // Cao → thấp
        if (order === 'descend') return dateA - dateB; // Thấp → cao
        return dateB - dateA; // Default: cao → thấp
      },
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'Tổng',
      key: 'total',
      align: 'center',
      width: 100,
      render: (_, record) => {
        const { total } = getInventoryInfo(record);
        return <span>{total}</span>;
      },
      sorter: (a, b) => {
        const { total: totalA } = getInventoryInfo(a);
        const { total: totalB } = getInventoryInfo(b);
        // Mũi tên lên (ascend) = cao → thấp
        // Mũi tên xuống (descend) = thấp → cao
        const order = sortState['total'];
        if (order === 'ascend') return totalB - totalA; // Cao → thấp
        if (order === 'descend') return totalA - totalB; // Thấp → cao
        return totalB - totalA; // Default: cao → thấp
      },
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'Đang Rảnh',
      key: 'available',
      align: 'center',
      width: 120,
      render: (_, record) => {
        const { available } = getInventoryInfo(record);
        return <Tag color="success">{available}</Tag>;
      },
      sorter: (a, b) => {
        const { available: availableA } = getInventoryInfo(a);
        const { available: availableB } = getInventoryInfo(b);
        // Mũi tên lên (ascend) = cao → thấp
        // Mũi tên xuống (descend) = thấp → cao
        const order = sortState['available'];
        if (order === 'ascend') return availableB - availableA; // Cao → thấp
        if (order === 'descend') return availableA - availableB; // Thấp → cao
        return availableB - availableA; // Default: cao → thấp
      },
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'Đang Mượn',
      key: 'borrowing',
      align: 'center',
      width: 120,
      render: (_, record) => {
        const { borrowing } = getInventoryInfo(record);
        return <Tag color="warning">{borrowing}</Tag>;
      },
      sorter: (a, b) => {
        const { borrowing: borrowingA } = getInventoryInfo(a);
        const { borrowing: borrowingB } = getInventoryInfo(b);
        // Mũi tên lên (ascend) = cao → thấp
        // Mũi tên xuống (descend) = thấp → cao
        const order = sortState['borrowing'];
        if (order === 'ascend') return borrowingB - borrowingA; // Cao → thấp
        if (order === 'descend') return borrowingA - borrowingB; // Thấp → cao
        return borrowingB - borrowingA; // Default: cao → thấp
      },
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'Hỏng',
      key: 'broken',
      align: 'center',
      width: 100,
      render: (_, record) => {
        const { broken } = getInventoryInfo(record);
        return <Tag color="error">{broken}</Tag>;
      },
      sorter: (a, b) => {
        const { broken: brokenA } = getInventoryInfo(a);
        const { broken: brokenB } = getInventoryInfo(b);
        // Mũi tên lên (ascend) = cao → thấp
        // Mũi tên xuống (descend) = thấp → cao
        const order = sortState['broken'];
        if (order === 'ascend') return brokenB - brokenA; // Cao → thấp
        if (order === 'descend') return brokenA - brokenB; // Thấp → cao
        return brokenB - brokenA; // Default: cao → thấp
      },
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 200,
      render: (_, record) => {
        const devId = record._id || record.id;
        return (
          <Space>
            <Button
              type="primary"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => navigate(`/school/device/${devId}`)}
            >
              Xem
            </Button>
            <Popconfirm
              title="Xóa thiết bị"
              description={`Bạn có chắc chắn muốn xóa thiết bị "${record.name}"?`}
              onConfirm={() => handleDelete(record)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="primary"
                danger
                icon={<DeleteOutlined />}
                size="small"
              >
                Xóa
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ], [sortState, categories, inventories, navigate]);

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <SchoolAdminSidebar />
      <Layout style={{ marginLeft: 260 }}>
        <Content style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <Card style={{ marginBottom: 24, background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3} style={{ margin: 0 }}>
              Danh sách thiết bị
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => navigate('/school/devices/create-with-instances')}
            >
              Thêm Thiết Bị
            </Button>
          </div>
        </Card>

        {/* Filters */}
        <Card style={{ marginBottom: 24, background: '#fff' }}>
          <Space wrap style={{ width: '100%' }}>
            <Select
              value={selectedCategory}
              onChange={setSelectedCategory}
              style={{ width: 200 }}
              placeholder="Loại linh kiện"
            >
              <Option value="all">Tất Cả</Option>
              {categories.map((cat) => (
                <Option key={cat._id || cat.name} value={cat._id || ''}>
                  {cat.name}
                </Option>
              ))}
            </Select>

            <Input
              placeholder="Tìm kiếm thiết bị theo tên..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />

            <Select
              value={sort}
              onChange={setSort}
              style={{ width: 180 }}
              placeholder="Sắp xếp"
            >
              <Option value="newest">Mới Nhất</Option>
              <Option value="oldest">Cũ Nhất</Option>
            </Select>
          </Space>
        </Card>

        {/* Table */}
        <Card style={{ background: '#fff' }}>
          {error && (
            <div style={{ padding: '16px', color: '#ff4d4f', marginBottom: 16 }}>
              {error}
            </div>
          )}

          <Table
            columns={columns}
            dataSource={filteredDevices}
            rowKey={(record) => record._id || record.id}
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} thiết bị`,
            }}
            locale={{
              emptyText: 'Không có thiết bị nào',
            }}
            onChange={(pagination, filters, sorter) => {
              if (sorter && sorter.columnKey) {
                setSortState({
                  [sorter.columnKey]: sorter.order || null,
                });
              }
            }}
          />
        </Card>
        </Content>
      </Layout>
    </Layout>
  );
}

export default SchoolDashboard;
