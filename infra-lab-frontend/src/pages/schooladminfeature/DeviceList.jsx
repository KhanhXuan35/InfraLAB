import React, { useEffect, useState } from 'react';
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
import api from '../../services/api';
import SchoolAdminSidebar from '../../components/Sidebar/SchoolAdminSidebar';
import './DeviceList.css';

const { Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

function DeviceList() {
  const navigate = useNavigate();

  // ============================================
  // INIT STATE: Khởi tạo các state để lưu dữ liệu
  // ============================================
  const [devices, setDevices] = useState([]);           // Lưu danh sách thiết bị
  const [categories, setCategories] = useState([]);    // Lưu danh sách danh mục
  const [inventories, setInventories] = useState([]);   // Lưu danh sách inventory
  const [loading, setLoading] = useState(false);       // Trạng thái đang tải
  const [error, setError] = useState(null);             // Lưu lỗi 
  const [search, setSearch] = useState('');             // tìm kiếm
  const [selectedCategory, setSelectedCategory] = useState('all'); // Danh mục đã chọn
  const [sort, setSort] = useState('newest');           // Cách sắp xếp

  // ============================================
  // USEEFFECT: Gọi API backend và lưu vào state
  // ============================================
  useEffect(() => {
    loadData();
  }, []);

  // Hàm gọi API để lấy dữ liệu từ backend
  const loadData = async () => {
    // : Bật trạng thái loading
    setLoading(true);
    setError(null);

    try {
      // : Gọi 3 API cùng lúc
      const catRes = await api.get('/device-categories');      // Lấy danh mục
      const devRes = await api.get('/devices?location=warehouse'); // Lấy thiết bị
      const invRes = await api.get('/inventories');            // Lấy inventory

      // : Lưu dữ liệu vào state
      setCategories(catRes?.data || []);
      setInventories(invRes?.data || []);

      //  Sắp xếp danh sách thiết bị theo tên
      const deviceList = devRes?.data || [];
      
      // Sắp xếp theo tên (A-Z)
      const sortedList = [...deviceList].sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });

      // Bước 5: Lưu danh sách đã sắp xếp vào state
      setDevices(sortedList);

    } catch (err) {
      // Nếu có lỗi, lưu thông báo lỗi
      console.error('Load data error:', err);
      setError(err.message || 'Không thể tải dữ liệu');
      message.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // LỌC DỮ LIỆU: Lọc danh sách thiết bị theo tìm kiếm và danh mục
  // ============================================
  const getFilteredDevices = () => {  // lọc danh sách thiết bị theo tìm kiếm và danh mục
    // Nếu không có dữ liệu, trả về mảng rỗng
    if (!Array.isArray(devices) || devices.length === 0) {
      return [];
    }

    // Lọc danh sách thiết bị
    const result = devices.filter((device) => {
      if (!device) return false;

      // Kiểm tra tên thiết bị có chứa từ khóa tìm kiếm không
      const deviceName = (device.name || '').toLowerCase();
      const searchKeyword = (search || '').toLowerCase().trim();
      const nameMatches = deviceName.includes(searchKeyword);

      // Kiểm tra danh mục có khớp không
      let categoryMatches = false;
      if (selectedCategory === 'all') {
        categoryMatches = true; // Chọn "Tất cả" thì hiển thị hết
      } else {
        // Lấy category_id từ device
        const catField = device.category_id || device.category;
        let deviceCategoryId = '';
        
        if (catField) {
          if (typeof catField === 'object') {
            deviceCategoryId = catField._id || catField;
          } else {
            deviceCategoryId = catField;
          }
        }

        // So sánh category_id
        const normalizedDeviceCategoryId = String(deviceCategoryId).trim().toLowerCase();
        const normalizedSelectedCategory = String(selectedCategory).trim().toLowerCase();
        categoryMatches = normalizedDeviceCategoryId === normalizedSelectedCategory;
      }

      // Nếu cả 2 điều kiện đều đúng, thêm vào kết quả
      return nameMatches && categoryMatches;
    });

    // Sắp xếp kết quả
    const hasNoFilters = !search.trim() && selectedCategory === 'all';
    if (hasNoFilters) {
      // Sắp xếp theo tên (A-Z)
      result.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else {
      // Sắp xếp theo ngày tạo
      result.sort((a, b) => {
        const dateA = new Date(a.createdAt || a._id || 0);
        const dateB = new Date(b.createdAt || b._id || 0);
        
        if (sort === 'newest') {
          return dateB - dateA; // Mới nhất trước
        } else {
          return dateA - dateB; // Cũ nhất trước
        }
      });
    }

    return result;
  };

  // Lấy danh sách đã lọc
  const filteredDevices = getFilteredDevices();

  // ============================================
  // XỬ LÝ SỰ KIỆN: Xóa thiết bị
  // ============================================
  const handleDelete = async (device) => {
    try {
      const devId = device._id || device.id;
      await api.delete(`/devices/${devId}`);
      message.success('Đã xóa thiết bị thành công');
      await loadData(); // Tải lại dữ liệu sau khi xóa
    } catch (error) {
      console.error('Delete device error:', error);
      message.error(error.message || 'Không thể xóa thiết bị');
    }
  };

  // ============================================
  // HÀM HỖ TRỢ: Lấy thông tin inventory của thiết bị
  // ============================================
  const getInventoryInfo = (device) => {
    const devId = device._id || device.id || '';
    
    // Tìm inventory tương ứng với device
    const inv = inventories.find((inventory) => {
      const iDev = inventory.device_id?._id || inventory.device_id || '';
      return String(iDev) === String(devId);
    });

    // Lấy các giá trị từ inventory
    const total = inv?.total || 0;
    const available = inv?.available || 0;
    const broken = inv?.broken || 0;
    const borrowing = Math.max(total - available - broken, 0);

    return { total, available, broken, borrowing };
  };

  // ============================================
  // HÀM HỖ TRỢ: Lấy tên danh mục của thiết bị
  // ============================================
  const getCategoryName = (device) => {
    // Lấy category_id từ device
    const catField = device.category_id || device.category;
    
    // Nếu category_id là object và có name, trả về name
    if (catField && typeof catField === 'object' && catField.name) {
      return catField.name;
    }

    // Lấy category_id
    const catId = catField?._id || catField;
    
    // Tìm trong danh sách categories
    const cat = categories.find((c) => String(c._id) === String(catId));
    if (cat) {
      return cat.name;
    }

    return 'N/A';
  };

  // ============================================
  // ĐỊNH NGHĨA CÁC CỘT CỦA BẢNG
  // ============================================
  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      render: (_, __, index) => index + 1, // Hiển thị số thứ tự
    },
    {
      title: 'Ảnh',
      key: 'image',
      width: 80,
      render: (_, record) => {
        // Nếu có ảnh, hiển thị ảnh
        if (record.image) {
          return (
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
          );
        } else {
          // Nếu không có ảnh, hiển thị placeholder
          return (
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
          );
        }
      },
    },
    {
      title: 'Tên Thiết Bị',
      dataIndex: 'name', // Lấy giá trị từ field 'name'
      key: 'name',
      render: (text) => <strong style={{ fontSize: '14px' }}>{text}</strong>, 
    },
    {
      title: 'Danh Mục',
      key: 'category',
      render: (_, record) => {
        const categoryName = getCategoryName(record);
        return <Tag color="blue">{categoryName}</Tag>;
      },
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
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 200,
      render: (_, record) => {
        const devId = record._id || record.id;
        // chức năng xem detail device
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
  ];

  // ============================================
  // SHOW STATE: Hiển thị dữ liệu ra màn hình
  // ============================================
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
              <Select     //dropdown danh mục thiết bị
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

          {/* Table - Hiển thị danh sách thiết bị */}
          <Card style={{ background: '#fff' }}>
            {error && (
              <div style={{ padding: '16px', color: '#ff4d4f', marginBottom: 16 }}>
                {error}
              </div>
            )}

            <Table
              columns={columns}              // Cấu trúc các cột
              dataSource={filteredDevices}  // Dữ liệu từ state (đã lọc)
              rowKey={(record) => record._id || record.id}
              loading={loading}              // Hiển thị loading khi đang tải
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Tổng ${total} thiết bị`,
              }}
              locale={{
                emptyText: 'Không có thiết bị nào',
              }}
            />
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
}

export default DeviceList;
