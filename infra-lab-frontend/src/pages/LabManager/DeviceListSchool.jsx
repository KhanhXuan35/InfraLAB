import React, { useEffect, useState, useCallback } from 'react';
import { Layout, Typography, Button, message } from 'antd';
import api from '../../services/api';
import LabManagerSidebar from '../../components/Sidebar/LabManagerSidebar';
import NotificationBell from '../../components/NotificationBell/NotificationBell';
import '../../components/LabManager/deviceList.css';
import '../../dashboard.css';

const { Content } = Layout;
const { Title, Text } = Typography;

// ============================================
// COMPONENT: DANH SÁCH THIẾT BỊ KHO SCHOOL
// ============================================
const DeviceListSchool = () => {
  // ============================================
  // PHẦN 1: KHỞI TẠO (INIT) - KHAI BÁO STATE
  // ============================================
  
  // State lưu dữ liệu từ API
  const [categories, setCategories] = useState([]); // Danh sách danh mục
  const [allDevices, setAllDevices] = useState([]); // Danh sách thiết bị gốc (từ API)
  const [devices, setDevices] = useState([]); // Danh sách thiết bị đã filter (để hiển thị)
  
  // State quản lý trạng thái
  const [loading, setLoading] = useState(true); // Đang tải dữ liệu
  const [error, setError] = useState(''); // Thông báo lỗi
  const [notice, setNotice] = useState(''); // Thông báo thành công
  
  // State quản lý mượn thiết bị
  const [borrowLoading, setBorrowLoading] = useState(null); // ID thiết bị đang xử lý
  const [qtyMap, setQtyMap] = useState({}); // Lưu số lượng mượn cho mỗi thiết bị
  
  // State quản lý modal tạo yêu cầu thiết bị ngoài
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestFormData, setRequestFormData] = useState({
    name: '',
    description: '',
    image: '',
    category_id: '',
    total: 1,
  });
  const [requestSaving, setRequestSaving] = useState(false);
  const [requestError, setRequestError] = useState('');
  
  // State quản lý filter và pagination
  const [search, setSearch] = useState(''); // Tìm kiếm theo tên
  const [category, setCategory] = useState('all'); // Filter theo danh mục
  const [status, setStatus] = useState('all'); // Filter theo trạng thái
  const [itemsPerPage, setItemsPerPage] = useState(10); // Số item mỗi trang
  const [currentPage, setCurrentPage] = useState(1); // Trang hiện tại

  // ============================================
  // PHẦN 2: CALL API - CÁC HÀM GỌI API LẤY DỮ LIỆU
  // ============================================
  
  /**
   * Hàm hỗ trợ: Lấy số lượng instances của một thiết bị
   */
  const getDeviceInstanceCount = async (deviceId, reservedCount) => {
    try {
      const instancesRes = await api.get(
        `/school-admin/devices/${deviceId}/instances?location=warehouse&limit=1&page=1`
      );
      const totalInWarehouse = instancesRes?.pagination?.total || instancesRes?.data?.length || 0;
      const availableCount = Math.max(0, totalInWarehouse - reservedCount);
      return { count: availableCount, totalInWarehouse, reservedCount };
    } catch {
      try {
        const instancesRes = await api.get(
          `/school-admin/devices/${deviceId}/instances?location=warehouse&limit=1000`
        );
        const instances = Array.isArray(instancesRes) ? instancesRes : instancesRes?.data || [];
        const totalInWarehouse = instancesRes?.pagination?.total || instances.length || 0;
        const availableCount = Math.max(0, totalInWarehouse - reservedCount);
        return { count: availableCount, totalInWarehouse, reservedCount };
      } catch {
        return { count: 0, totalInWarehouse: 0, reservedCount: 0 };
      }
    }
  };

  /**
   * Hàm hỗ trợ: Lấy số lượng đã reserve (approved nhưng chưa deliver)
   */
  const getReservedCounts = async () => {
    try {
      const approvedRequestsRes = await api.get('/request-lab?status=APPROVED&requester_role=lab_manager');
      const approvedRequests = Array.isArray(approvedRequestsRes)
        ? approvedRequestsRes
        : approvedRequestsRes?.data || [];

      const reservedCountsMap = {};
      approvedRequests.forEach((req) => {
        const deviceId = req.device_id?._id || req.device_id || '';
        const reservedCount = req.device_instance_ids?.length || req.qty || 0;
        if (deviceId) {
          const deviceIdStr = deviceId.toString();
          reservedCountsMap[deviceIdStr] = (reservedCountsMap[deviceIdStr] || 0) + reservedCount;
        }
      });
      return reservedCountsMap;
    } catch {
      return {};
    }
  };

  /**
   * Hàm chính: Gọi API lấy tất cả dữ liệu cần thiết
   * Luồng:
   * 1. Gọi API lấy categories, devices, inventories
   * 2. Lấy số lượng đã reserve
   * 3. Với mỗi device, lấy số lượng instances thực tế
   * 4. Merge và xử lý dữ liệu
   * 5. Trả về dữ liệu đã xử lý
   */
  const fetchDataFromAPI = async () => {
    setLoading(true);
    setError('');
    setNotice('');

    try {
      // Bước 1: Gọi API lấy dữ liệu cơ bản (gọi đồng thời 3 API)
      const [catRes, devRes, invRes] = await Promise.all([
        api.get('/device-categories'), // API 1: Lấy danh sách danh mục
        api.get('/devices?location=warehouse'), // API 2: Lấy danh sách thiết bị
        api.get('/inventories'), // API 3: Lấy thông tin inventory
      ]);

      // Xử lý dữ liệu từ API
      const categoriesList = Array.isArray(catRes) ? catRes : catRes?.data || [];
      const devicesList = Array.isArray(devRes) ? devRes : devRes?.data || [];
      const inventoriesList = Array.isArray(invRes) ? invRes : invRes?.data || [];

      // Bước 2: Lấy số lượng đã reserve
      const reservedCountsMap = await getReservedCounts();

      // Bước 3: Lấy số lượng instances thực tế cho mỗi device
      const deviceInstanceCounts = await Promise.all(
        devicesList.map(async (dev) => {
          const devId = dev._id || dev.id || '';
          const devIdStr = devId.toString();
          const reservedCount = reservedCountsMap[devIdStr] || 0;
          const result = await getDeviceInstanceCount(devId, reservedCount);
          return { deviceId: devId, count: result.count };
        })
      );

      // Tạo map để tra cứu nhanh
      const countMap = {};
      deviceInstanceCounts.forEach(({ deviceId, count }) => {
        countMap[deviceId] = count;
      });

      // Bước 4: Merge dữ liệu từ các nguồn
      const merged = devicesList.map((dev) => {
        const devId = dev._id || dev.id || '';
        
        // Tìm inventory tương ứng với device
        const inv = inventoriesList.find((i) => {
          const invDevId = i.device_id?._id || i.device_id || '';
          return String(invDevId) === String(devId);
        });
        
        // Lấy thông tin từ inventory
        const total = inv?.total ?? 0;
        const available = inv?.available ?? 0;
        const broken = inv?.broken ?? 0;
        const borrowing = Math.max(total - available - broken, 0);
        
        // Lấy số lượng instances thực tế
        const totalInstances = countMap[devId] || 0;

        // Trả về object đã merge
        return {
          ...dev, // Giữ nguyên thông tin device gốc
          inventory: { total, available, broken, borrowing },
          totalInstances: totalInstances,
        };
      });

      // Bước 5: Sắp xếp theo bảng chữ cái
      const sorted = merged.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB, 'vi');
      });

      // Trả về dữ liệu đã xử lý
      return {
        categories: categoriesList,
        devices: sorted,
      };
    } catch {
      setError('Không lấy được danh sách kho school');
      return {
        categories: [],
        devices: [],
      };
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // PHẦN 3: LƯU VÀO STATE - GỌI API VÀ LƯU DỮ LIỆU VÀO STATE
  // ============================================
  
  /**
   * Hàm gọi API và lưu dữ liệu vào state
   */
  const fetchData = useCallback(async () => {
    const result = await fetchDataFromAPI();
    
    // Lưu dữ liệu vào state
    setCategories(result.categories);
    setAllDevices(result.devices);
    setDevices(result.devices); // Ban đầu chưa filter, hiển thị tất cả
  }, []); // fetchDataFromAPI là hàm độc lập, không cần thêm vào dependency

  /**
   * Effect: Gọi API khi component mount lần đầu
   */
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Effect: Filter dữ liệu khi search/category/status thay đổi
   */
  useEffect(() => {
    let filtered = [...allDevices];

    // Filter theo tên (search)
    if (search.trim()) {
      const keyword = search.toLowerCase();
      filtered = filtered.filter((d) => (d.name || '').toLowerCase().includes(keyword));
    }

    // Filter theo danh mục
    if (category !== 'all') {
      filtered = filtered.filter((d) => {
        const catField = d.category_id ?? d.category;
        const catId = typeof catField === 'object' ? catField._id : catField;
        return String(catId) === String(category);
      });
    }

    // Filter theo trạng thái
    if (status !== 'all') {
      filtered = filtered.filter((d) => {
        const inv = d.inventory || {};
        if (status === 'available') return inv.available > 0;
        if (status === 'borrowed') return inv.borrowing > 0;
        if (status === 'broken') return inv.broken > 0;
        return true;
      });
    }

    // Sắp xếp theo bảng chữ cái khi không có filter
    const hasNoFilters = !search.trim() && category === 'all' && status === 'all';
    if (hasNoFilters) {
      filtered.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB, 'vi');
      });
    }

    // Lưu kết quả filter vào state
    setDevices(filtered);
    setCurrentPage(1); // Reset về trang 1 khi filter
  }, [search, category, status, allDevices]);

  // ============================================
  // PHẦN 4: CẤU TRÚC BẢNG - ĐỊNH NGHĨA CẤU TRÚC DỮ LIỆU ĐỂ HIỂN THỊ
  // ============================================
  
  /**
   * Tính toán dữ liệu cho pagination
   */
  const filteredData = devices; // Dữ liệu đã filter
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const visibleItems = filteredData.slice(indexOfFirst, indexOfLast); // Dữ liệu hiển thị trên trang hiện tại

  /**
   * Hàm lấy tên danh mục từ device
   */
  const getCategoryName = (item) => {
    const catField = item.category_id ?? item.category;
    if (catField && typeof catField === 'object' && catField.name) {
      return catField.name;
    }
    const catId = catField?._id || catField;
    const found = categories.find((c) => String(c._id) === String(catId));
    return found?.name || 'N/A';
  };

  // ============================================
  // PHẦN 5: CÁC HÀM XỬ LÝ SỰ KIỆN
  // ============================================
  
  /**
   * Reset filter về mặc định
   */
  const resetFilter = () => {
    setSearch('');
    setCategory('all');
    setStatus('all');
    const sorted = [...allDevices].sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB, 'vi');
    });
    setDevices(sorted);
    setCurrentPage(1);
  };

  /**
   * Xử lý mượn thiết bị
   */
  const handleBorrow = async (deviceId, qty, maxAvailable) => {
    setError('');
    setNotice('');

    if (qty < 1) {
      setError('Số lượng không hợp lệ');
      return;
    }
    if (qty > maxAvailable) {
      setError(`Số lượng mượn không được vượt quá số lượng đang rảnh (${maxAvailable})`);
      return;
    }

    try {
      setBorrowLoading(deviceId);
      const userString = localStorage.getItem('user');
      const userData = userString ? JSON.parse(userString) : null;
      const userId = userData?._id || userData?.id;

      await api.post('/request-lab', {
        device_id: deviceId,
        qty,
        user_id: userId,
        requester_role: 'lab_manager',
        status: 'WAITING',
      });

      message.success('Đã gửi yêu cầu mượn. Vui lòng chờ School Admin duyệt.');
      await fetchData();
    } catch (err) {
      const msg = err?.message || err?.response?.data?.message || 'Gửi yêu cầu thất bại';
      setError(msg);
    } finally {
      setBorrowLoading(null);
    }
  };

  /**
   * Xử lý upload ảnh
   */
  const handleImageUpload = (file, callback) => {
    if (file.size > 2 * 1024 * 1024) {
      setRequestError('Kích thước ảnh không được vượt quá 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const maxSize = 800;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        callback(compressedBase64);
      };
      img.src = reader.result;
    };
    reader.onerror = () => {
      setRequestError('Không thể đọc file ảnh');
    };
    reader.readAsDataURL(file);
  };

  /**
   * Xử lý tạo yêu cầu thiết bị ngoài
   */
  const handleCreateRequest = async () => {
    setRequestError('');

    if (!requestFormData.name.trim()) {
      setRequestError('Vui lòng nhập tên thiết bị');
      return;
    }
    if (!requestFormData.category_id) {
      setRequestError('Vui lòng chọn loại linh kiện');
      return;
    }
    if (requestFormData.total < 1) {
      setRequestError('Số lượng phải lớn hơn 0');
      return;
    }

    try {
      setRequestSaving(true);
      const userString = localStorage.getItem('user');
      const userData = userString ? JSON.parse(userString) : null;
      const userId = userData?._id || userData?.id;

      if (!userId) {
        setRequestError('Không tìm thấy thông tin người dùng');
        setRequestSaving(false);
        return;
      }

      const payload = {
        name: requestFormData.name,
        description: requestFormData.description || '',
        image: requestFormData.image || '',
        category_id: requestFormData.category_id,
        total: requestFormData.total,
        location: 'warehouse',
        userId,
      };

      await api.post('/devices', payload); 
      setShowRequestModal(false);
      setRequestFormData({ name: '', description: '', image: '', category_id: '', total: 1 });
      setNotice('✅ Đã tạo yêu cầu thiết bị thành công! Vui lòng chờ School Admin duyệt.');
      await fetchData();

      setTimeout(() => setNotice(''), 5000);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Tạo yêu cầu thất bại';
      setRequestError(msg);
    } finally {
      setRequestSaving(false);
    }
  };

  // ============================================
  // PHẦN 6: SHOW RA GIAO DIỆN - RENDER UI
  // ============================================
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <LabManagerSidebar />

      <Layout style={{ marginLeft: 240, background: '#f5f7fa' }}>
        <Content style={{ padding: '24px', background: '#f5f7fa', minHeight: '100vh' }}>
          <div className={`content-wrapper ${loading ? 'loading' : ''}`} style={{ background: 'transparent' }}>
            {/* ===== HEADER ===== */}
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Title level={2} style={{ margin: 0, color: '#1a202c', fontWeight: 700 }}>
                  Danh sách linh kiện kho School
                </Title>
                <Text type="secondary" style={{ fontSize: 14, color: '#718096' }}>
                  Quản lý và mượn thiết bị từ kho School
                </Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <NotificationBell />
                <Button
                  type="primary"
                  onClick={fetchData}
                  loading={loading}
                  size="large"
                  style={{
                    height: '40px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(24, 144, 255, 0.2)',
                  }}
                >
                  Tải lại
                </Button>
              </div>
            </div>

            {/* ===== FILTER BAR ===== */}
            <div
              style={{
                background: '#ffffff',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                marginBottom: 20,
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <input
                placeholder="Tìm theo tên linh kiện..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  flex: '1 1 250px',
                  minWidth: '250px',
                  height: '40px',
                  padding: '0 16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#1890ff')}
                onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              />

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  flex: '0 0 auto',
                  width: '200px',
                  height: '40px',
                  padding: '0 16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: '#ffffff',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="all">Tất cả danh mục</option>
                {categories.map((c) => (
                  <option key={c._id || c.name} value={c._id || ''}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  flex: '0 0 auto',
                  width: '200px',
                  height: '40px',
                  padding: '0 16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: '#ffffff',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="available">Đang rảnh &gt; 0</option>
                <option value="borrowed">Đang mượn &gt; 0</option>
                <option value="broken">Hỏng &gt; 0</option>
              </select>

              <Button
                onClick={resetFilter}
                style={{
                  flex: '0 0 auto',
                  height: '40px',
                  borderRadius: '8px',
                  borderColor: '#e2e8f0',
                }}
              >
                Reset
              </Button>

              <Button
                onClick={() => setShowRequestModal(true)}
                style={{
                  flex: '0 0 auto',
                  height: '40px',
                  borderRadius: '8px',
                  fontWeight: 600,
                }}
              >
                Tạo yêu cầu thiết bị ngoài
              </Button>
            </div>

            {/* ===== THÔNG BÁO LỖI ===== */}
            {error && (
              <div
                style={{
                  marginBottom: 16,
                  padding: '12px 16px',
                  background: '#fff2f0',
                  border: '1px solid #ffccc7',
                  borderRadius: '8px',
                  color: '#cf1322',
                }}
              >
                {error}
              </div>
            )}

            {/* ===== THÔNG BÁO THÀNH CÔNG ===== */}
            {notice && (
              <div
                style={{
                  marginBottom: 16,
                  padding: '12px 16px',
                  background: '#f6ffed',
                  border: '1px solid #b7eb8f',
                  borderRadius: '8px',
                  color: '#389e0d',
                }}
              >
                {notice}
              </div>
            )}

            {/* ===== BẢNG DANH SÁCH THIẾT BỊ ===== */}
            <div
              className="device-table"
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                overflow: 'hidden',
              }}
            >
              <table>
                {/* ===== HEADER CỦA BẢNG ===== */}
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ width: 50, padding: '16px 12px', fontWeight: 600, color: '#1a202c', fontSize: '13px' }}>
                      #
                    </th>
                    <th style={{ width: 110, padding: '16px 12px', fontWeight: 600, color: '#1a202c', fontSize: '13px' }}>
                      Ảnh
                    </th>
                    <th style={{ width: 220, padding: '16px 12px', fontWeight: 600, color: '#1a202c', fontSize: '13px' }}>
                      Tên linh kiện
                    </th>
                    <th style={{ width: 180, padding: '16px 12px', fontWeight: 600, color: '#1a202c', fontSize: '13px' }}>
                      Danh mục
                    </th>
                    <th
                      style={{
                        width: 150,
                        padding: '16px 12px',
                        fontWeight: 600,
                        color: '#1a202c',
                        fontSize: '13px',
                        textAlign: 'center',
                      }}
                    >
                      Tổng số mã thiết bị
                    </th>
                    <th
                      style={{
                        width: 180,
                        padding: '16px 12px',
                        fontWeight: 600,
                        color: '#1a202c',
                        fontSize: '13px',
                        textAlign: 'center',
                      }}
                    >
                      Hành động
                    </th>
                  </tr>
                </thead>
                
                {/* ===== BODY CỦA BẢNG - HIỂN THỊ DỮ LIỆU ===== */}
                <tbody>
                  {/* Trường hợp không có dữ liệu */}
                  {visibleItems.length === 0 && (
                    <tr>
                      <td colSpan="6" className="center" style={{ padding: 16 }}>
                        {loading ? 'Đang tải...' : 'Không có dữ liệu'}
                      </td>
                    </tr>
                  )}

                  {/* Render từng hàng thiết bị */}
                  {visibleItems.map((item, index) => {
                    const categoryName = getCategoryName(item);
                    const devId = item._id || item.id || '';
                    const inputQty = qtyMap[devId] ?? 1;
                    const maxAvailable = item.inventory?.available ?? 0;

                    return (
                      <tr
                        key={item._id || index}
                        style={{
                          borderBottom: '1px solid #f0f0f0',
                          transition: 'background-color 0.2s',
                        }}
                      >
                        {/* Cột 1: Số thứ tự */}
                        <td style={{ padding: '16px 12px', textAlign: 'center', color: '#718096', fontSize: '14px' }}>
                          {indexOfFirst + index + 1}
                        </td>
                        
                        {/* Cột 2: Ảnh thiết bị */}
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                style={{
                                  width: 60,
                                  height: 60,
                                  borderRadius: '8px',
                                  objectFit: 'cover',
                                  border: '1px solid #e2e8f0',
                                  background: '#ffffff',
                                }}
                                onError={(e) => {
                                  e.currentTarget.src = 'https://via.placeholder.com/60?text=No+Image';
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 60,
                                  height: 60,
                                  borderRadius: '8px',
                                  border: '1px dashed #d1d5db',
                                  background: '#f9fafb',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#9ca3af',
                                  fontSize: '10px',
                                  textAlign: 'center',
                                }}
                              >
                                No Image
                              </div>
                            )}
                          </div>
                        </td>
                        
                        {/* Cột 3: Tên linh kiện */}
                        <td style={{ padding: '16px 12px' }}>
                          <Text strong style={{ fontSize: '14px', color: '#1a202c' }}>
                            {item.name}
                          </Text>
                        </td>
                        
                        {/* Cột 4: Danh mục */}
                        <td style={{ padding: '16px 12px' }}>
                          <Text style={{ fontSize: '14px', color: '#4a5568' }}>{categoryName}</Text>
                        </td>
                        
                        {/* Cột 5: Tổng số mã thiết bị */}
                        <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                          {item.totalInstances > 0 ? (
                            <Text strong style={{ fontSize: '14px', color: '#1890ff' }}>
                              {item.totalInstances}
                            </Text>
                          ) : (
                            <Text type="secondary" style={{ fontSize: '13px', fontStyle: 'italic' }}>
                              Đã hết mã sản phẩm
                            </Text>
                          )}
                        </td>
                        
                        {/* Cột 6: Hành động (Mượn) */}
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              justifyContent: 'center',
                            }}
                          >
                            <input
                              type="number"
                              min="1"
                              max={maxAvailable}
                              value={inputQty}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 1;
                                setQtyMap((prev) => ({
                                  ...prev,
                                  [devId]: Math.min(val, maxAvailable),
                                }));
                              }}
                              style={{
                                width: '60px',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                background: '#ffffff',
                                color: '#1a202c',
                                textAlign: 'center',
                                fontSize: '13px',
                                outline: 'none',
                              }}
                            />
                            <Button
                              size="small"
                              type="primary"
                              loading={borrowLoading === devId}
                              onClick={() => handleBorrow(devId, inputQty, maxAvailable)}
                              style={{
                                borderRadius: '6px',
                                fontWeight: 600,
                                height: '32px',
                                padding: '0 16px',
                              }}
                            >
                              Mượn
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ===== PAGINATION ===== */}
            <div className="pagination-container">
              <div className="page-left">
                <span>Show</span>
                <select
                  className="page-size-select"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span>items per page</span>
              </div>

              <div className="page-right">
                <span>
                  {filteredData.length === 0
                    ? '0 items'
                    : `${indexOfFirst + 1} - ${Math.min(indexOfLast, filteredData.length)} of ${filteredData.length} items`}
                </span>

                <button
                  className="page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </button>

                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    className={`page-number ${currentPage === i + 1 ? 'active' : ''}`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  className="page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </Content>
      </Layout>

      {/* ===== MODAL: TẠO YÊU CẦU THIẾT BỊ NGOÀI ===== */}
      {showRequestModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Tạo yêu cầu thiết bị ngoài</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowRequestModal(false);
                  setRequestFormData({ name: '', description: '', image: '', category_id: '', total: 1 });
                  setRequestError('');
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label>Tên thiết bị</label>
                <input
                  value={requestFormData.name}
                  onChange={(e) => setRequestFormData({ ...requestFormData, name: e.target.value })}
                  placeholder="Nhập tên thiết bị cần mua"
                />
              </div>
              <div className="form-row">
                <label>Mô tả</label>
                <textarea
                  value={requestFormData.description}
                  onChange={(e) => setRequestFormData({ ...requestFormData, description: e.target.value })}
                  placeholder="Mô tả ngắn"
                />
              </div>
              <div className="form-row">
                <label>Hình ảnh</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file, (base64) => {
                          setRequestFormData({ ...requestFormData, image: base64 });
                        });
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="image-upload"
                    style={{
                      width: '100px',
                      height: '100px',
                      border: '2px dashed #434343',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: requestFormData.image ? 'transparent' : '#1a1a1a',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {requestFormData.image ? (
                      <>
                        <img
                          src={requestFormData.image}
                          alt="Preview"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            background: '#ff4d4f',
                            color: '#fff',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            cursor: 'pointer',
                            borderBottomLeftRadius: '4px',
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setRequestFormData({ ...requestFormData, image: '' });
                            document.getElementById('image-upload').value = '';
                          }}
                        >
                          ×
                        </div>
                      </>
                    ) : (
                      <span style={{ fontSize: '40px', color: '#666' }}>+</span>
                    )}
                  </label>
                </div>
              </div>
              <div className="form-row">
                <label>Loại linh kiện</label>
                <select
                  value={requestFormData.category_id}
                  onChange={(e) => setRequestFormData({ ...requestFormData, category_id: e.target.value })}
                >
                  <option value="">Chọn loại</option>
                  {categories.map((cat) => (
                    <option key={cat._id || cat.name} value={cat._id || ''}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label>Tổng số lượng</label>
                <input
                  type="number"
                  min="0"
                  value={requestFormData.total}
                  onChange={(e) => setRequestFormData({ ...requestFormData, total: Number(e.target.value) || 0 })}
                  placeholder="Nhập tổng số lượng thiết bị"
                />
              </div>
              {requestError && <div className="inventory-status error">{requestError}</div>}
            </div>
            <div className="modal-footer">
              <button
                className="button-secondary"
                onClick={() => {
                  setShowRequestModal(false);
                  setRequestFormData({ name: '', description: '', image: '', category_id: '', total: 1 });
                  setRequestError('');
                }}
                disabled={requestSaving}
              >
                Hủy
              </button>
              <button className="button-primary" disabled={requestSaving} onClick={handleCreateRequest}>
                {requestSaving ? 'Đang lưu...' : 'Tạo yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default DeviceListSchool;
