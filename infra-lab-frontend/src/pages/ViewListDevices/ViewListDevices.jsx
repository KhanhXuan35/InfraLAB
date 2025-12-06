import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Row, Col, Tag, Empty, Spin, Select, Image, Typography, Space, Alert, message, Button, Pagination } from 'antd';
import { 
  ShoppingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons';
import { Container, CategoryFilter, DeviceCard, CardOverlay, BorrowButton } from './style';
import { STUDENT_ROUTES } from '../../constants/routes';

const { Title, Text } = Typography;
const { Option } = Select;

const ViewListDevices = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [devices, setDevices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [hoveredDevice, setHoveredDevice] = useState(null);
  const [sortOrder, setSortOrder] = useState('az'); // 'az', 'za', 'available', 'unavailable'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  useEffect(() => {
    fetchCategories();
    // Get search query from URL
    const search = searchParams.get('search');
    if (search) {
      setSearchQuery(search);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchDevices();
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    setCurrentPage(1); // Reset về trang 1 khi thay đổi category, search hoặc sort
  }, [selectedCategory, searchQuery, sortOrder]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/categories');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
        console.log('Categories loaded:', data.data);
      } else {
        console.error('Failed to fetch categories:', data.message);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError(`Không thể tải danh mục: ${error.message}`);
      message.error('Không thể kết nối đến server. Vui lòng kiểm tra backend đã chạy chưa.');
    }
  };

  const fetchDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = 'http://localhost:5000/api/devices?location=lab';
      
      // Add category filter
      if (selectedCategory !== 'all') {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      
      // Add search query
      if (searchQuery && searchQuery.trim() !== '') {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      
      console.log('Fetching devices from:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Devices response:', data);
      
      if (data.success) {
        setDevices(data.data || []);
        console.log('Devices loaded:', data.data);
      } else {
        console.error('Failed to fetch devices:', data.message);
        setError(data.message || 'Không thể tải danh sách thiết bị');
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      setError(`Không thể tải thiết bị: ${error.message}`);
      message.error('Không thể kết nối đến server. Vui lòng kiểm tra backend đã chạy chưa.');
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
  };

  const handleSortChange = (value) => {
    setSortOrder(value);
  };

  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Hàm sắp xếp thiết bị
  const sortDevices = (devicesList) => {
    const sorted = [...devicesList];
    
    switch (sortOrder) {
      case 'az':
        return sorted.sort((a, b) => {
          const nameA = a.name?.toLowerCase() || '';
          const nameB = b.name?.toLowerCase() || '';
          return nameA.localeCompare(nameB, 'vi');
        });
      case 'za':
        return sorted.sort((a, b) => {
          const nameA = a.name?.toLowerCase() || '';
          const nameB = b.name?.toLowerCase() || '';
          return nameB.localeCompare(nameA, 'vi');
        });
      case 'available':
        return sorted.sort((a, b) => {
          const availA = a.inventory?.available || 0;
          const availB = b.inventory?.available || 0;
          return availB - availA; // Sắp xếp giảm dần (nhiều nhất trước)
        });
      case 'unavailable':
        return sorted.sort((a, b) => {
          const availA = a.inventory?.available || 0;
          const availB = b.inventory?.available || 0;
          return availA - availB; // Sắp xếp tăng dần (ít nhất trước)
        });
      default:
        return sorted;
    }
  };

  // Lọc và sắp xếp thiết bị
  const filteredAndSortedDevices = React.useMemo(() => {
    let filtered = devices.filter(device => device.inventory && device.inventory.location === 'lab');
    
    // Nếu có search query, chỉ filter theo tên thiết bị (không filter theo category)
    if (searchQuery && searchQuery.trim() !== '') {
      const queryLower = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(device => 
        device.name && device.name.toLowerCase().includes(queryLower)
      );
    }
    
    return sortDevices(filtered);
  }, [devices, sortOrder, searchQuery]);

  // Tính toán thiết bị cho trang hiện tại
  const paginatedDevices = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredAndSortedDevices.slice(startIndex, endIndex);
  }, [filteredAndSortedDevices, currentPage, pageSize]);

  const getAvailabilityStatus = (inventory) => {
    if (!inventory) {
      return { status: 'no-data', text: 'Chưa có thông tin', color: 'default' };
    }
    if (inventory.available > 0) {
      return { status: 'available', text: 'Có sẵn', color: 'success' };
    }
    return { status: 'unavailable', text: 'Hết hàng', color: 'error' };
  };

  return (
    <Container>
      <Title level={2}>
        {searchQuery ? `Kết quả tìm kiếm: "${searchQuery}"` : 'Danh sách thiết bị'}
      </Title>
      {searchQuery && !loading && (
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            Tìm thấy {filteredAndSortedDevices.length} thiết bị
            {selectedCategory !== 'all' && ` trong danh mục "${selectedCategory}"`}
          </Text>
        </div>
      )}
      
      {error && (
        <Alert
          message="Lỗi"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}
      
      <CategoryFilter>
        <Space size="middle" wrap>
          <Select
            value={selectedCategory}
            onChange={handleCategoryChange}
            style={{ width: 200 }}
            placeholder="Chọn danh mục"
            loading={loading}
          >
            <Option value="all">Tất cả danh mục</Option>
            {categories.map((category) => (
              <Option key={category._id} value={category.name}>
                {category.name}
              </Option>
            ))}
          </Select>
          <Select
            value={sortOrder}
            onChange={handleSortChange}
            style={{ width: 200 }}
            placeholder="Sắp xếp"
          >
            <Option value="az">Sắp xếp A-Z</Option>
            <Option value="za">Sắp xếp Z-A</Option>
            <Option value="available">Nhiều sẵn có nhất</Option>
            <Option value="unavailable">Ít sẵn có nhất</Option>
          </Select>
        </Space>
      </CategoryFilter>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Đang tải dữ liệu...</Text>
          </div>
        </div>
      ) : filteredAndSortedDevices.length === 0 ? (
        <Empty 
          description="Không có thiết bị nào tại Lab" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Text type="secondary">
            {error ? 'Vui lòng kiểm tra kết nối server' : 'Chưa có thiết bị nào tại phòng Lab'}
          </Text>
        </Empty>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {paginatedDevices.map((device) => {
              const availability = getAvailabilityStatus(device.inventory);
              
              return (
                <Col xs={24} sm={12} md={8} lg={6} key={device._id}>
                  <DeviceCard
                    hoverable
                    onMouseEnter={() => setHoveredDevice(device._id)}
                    onMouseLeave={() => setHoveredDevice(null)}
                    style={{ position: 'relative' }}
                    cover={
                      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        {device.image ? (
                          <Image
                            alt={device.name}
                            src={device.image}
                            width="100%"
                            height={200}
                            style={{ 
                              objectFit: 'cover',
                              display: 'block'
                            }}
                            preview={false}
                            fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4="
                          />
                        ) : (
                          <div style={{ 
                            width: '100%',
                            height: '100%',
                            minHeight: '200px',
                            backgroundColor: '#f5f5f5', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                          }}>
                            <ShoppingOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                          </div>
                        )}
                        {hoveredDevice === device._id && (
                          <CardOverlay>
                            <BorrowButton
                              type="primary"
                              size="large"
                              icon={<ShoppingCartOutlined />}
                              onClick={() => navigate(STUDENT_ROUTES.DEVICE_DETAIL(device._id))}
                            >
                              Mượn thiết bị
                            </BorrowButton>
                          </CardOverlay>
                        )}
                      </div>
                    }
                    actions={[
                      <Space key="availability" direction="vertical" size="small" style={{ width: '100%', padding: '8px' }}>
                        <Tag 
                          color={availability.color} 
                          icon={availability.status === 'available' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                        >
                          {availability.text}
                        </Tag>
                        {device.inventory && (
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            Có sẵn: {device.inventory.available}/{device.inventory.total}
                          </Text>
                        )}
                      </Space>
                    ]}
                  >
                  <Card.Meta
                    title={device.name}
                    description={
                      device.category && (
                        <Tag color="blue">{device.category.name}</Tag>
                      )
                    }
                  />
                  </DeviceCard>
                </Col>
              );
            })}
          </Row>
          {filteredAndSortedDevices.length > pageSize && (
            <div style={{ 
              marginTop: 32, 
              display: 'flex', 
              justifyContent: 'center',
              paddingBottom: 24
            }}>
              <Pagination
                current={currentPage}
                total={filteredAndSortedDevices.length}
                pageSize={pageSize}
                pageSizeOptions={['12', '24', '48', '96']}
                showSizeChanger
                showQuickJumper
                showTotal={(total, range) => 
                  `${range[0]}-${range[1]} của ${total} thiết bị`
                }
                onChange={handlePageChange}
                onShowSizeChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </Container>
  );
};

export default ViewListDevices;

