import React, { useEffect, useState } from 'react';
import { Layout, Menu, Typography, Button, Modal } from 'antd';
import {
  DashboardOutlined,
  ToolOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  BellOutlined,
  AppstoreOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import '../../components/LabManager/deviceList.css';
import '../../dashboard.css';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;

const DeviceListSchool = () => {
  const navigate = useNavigate();

  const [devices, setDevices] = useState([]);
  const [allDevices, setAllDevices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [borrowLoading, setBorrowLoading] = useState(null);
  const [qtyMap, setQtyMap] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const [catRes, devRes, invRes] = await Promise.all([
        api.get('/device-categories'),
        api.get('/devices?location=warehouse'),
        api.get('/inventories'),
      ]);

      const categoriesList = Array.isArray(catRes) ? catRes : catRes?.data || [];
      const devicesList = Array.isArray(devRes) ? devRes : devRes?.data || [];
      const inventoriesList = Array.isArray(invRes) ? invRes : invRes?.data || [];

      const merged = devicesList.map((dev) => {
        const devId = dev._id || dev.id || '';
        const inv = inventoriesList.find((i) => {
          const invDevId = i.device_id?._id || i.device_id || '';
          return String(invDevId) === String(devId);
        });
        const total = inv?.total ?? 0;
        const available = inv?.available ?? 0;
        const broken = inv?.broken ?? 0;
        const borrowing = Math.max(total - available - broken, 0);
        return {
          ...dev,
          inventory: { total, available, broken, borrowing },
        };
      });

      setCategories(categoriesList);
      setAllDevices(merged);
      setDevices(merged);
    } catch (err) {
      setError('Khong lay duoc danh sach kho school');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...allDevices];

    if (search.trim()) {
      const keyword = search.toLowerCase();
      filtered = filtered.filter((d) => (d.name || '').toLowerCase().includes(keyword));
    }

    if (category !== 'all') {
  filtered = filtered.filter((d) => {
    const catField = d.category_id ?? d.category;
    const catId = typeof catField === 'object' ? catField._id : catField;
    return String(catId) === String(category);
  });
}

    if (status !== 'all') {
      filtered = filtered.filter((d) => {
        const inv = d.inventory || {};
        if (status === 'available') return inv.available > 0;
        if (status === 'borrowed') return inv.borrowing > 0;
        if (status === 'broken') return inv.broken > 0;
        return true;
      });
    }

    setDevices(filtered);
    setCurrentPage(1);
  }, [search, category, status, allDevices]);

  const resetFilter = () => {
    setSearch('');
    setCategory('all');
    setStatus('all');
    setDevices(allDevices);
    setCurrentPage(1);
  };

  const filteredData = devices;
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const visibleItems = filteredData.slice(indexOfFirst, indexOfLast);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={240}
        style={{
          background: '#001529',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          overflow: 'auto',
        }}
      >
        <div
          style={{
            padding: 24,
            textAlign: 'center',
            borderBottom: '1px solid #303030',
          }}
        >
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            InFra<span style={{ color: '#1890ff' }}>Lab</span>
          </Title>
          <Text type="secondary" style={{ color: '#8c8c8c', fontSize: 12 }}>
            QUAN LY PHONG LAB
          </Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={['school-inventory']}
          items={[
            { key: 'overview', icon: <DashboardOutlined />, label: 'Thong ke' },
            { key: 'devices', icon: <ToolOutlined />, label: 'Quan ly thiet bi' },
            { key: 'school-inventory', icon: <AppstoreOutlined />, label: 'Kho School' },
            { key: 'borrow', icon: <ShoppingOutlined />, label: 'Muon/Tra' },
            { key: 'reports', icon: <FileTextOutlined />, label: 'Bao cao' },
            { key: 'notifications', icon: <BellOutlined />, label: 'Thong bao' },
          ]}
          style={{ borderRight: 0, marginTop: 16 }}
          onSelect={({ key }) => {
            if (key === 'overview') navigate('/teacher-dashboard');
            else if (key === 'devices') navigate('/lab-manager/devices');
            else if (key === 'school-inventory') navigate('/lab-manager/school-devices');
            else if (key === 'borrow') navigate('/lab-manager/devices');
            else if (key === 'reports') navigate('/reports');
            else if (key === 'notifications') navigate('/notifications');
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 16,
            borderTop: '1px solid #303030',
            cursor: 'pointer',
          }}
          onClick={() => {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            navigate('/login');
          }}
        >
          <Button
            type="text"
            icon={<LogoutOutlined />}
            style={{ width: '100%', color: '#fff' }}
          >
            Dang xuat
          </Button>
        </div>
      </Sider>

      <Layout style={{ marginLeft: 240, background: '#ffffff' }}>
        <Content style={{ padding: '16px 24px', background: '#ffffff' }}>
          <div className={`content-wrapper ${loading ? 'loading' : ''}`}>
            <h2 className="page-title" style={{ marginBottom: 16, color: '#0f172a' }}>Danh sach linh kien kho School</h2>

            <div className="filter-bar" style={{ display: 'flex', gap: 8, alignItems: 'stretch', flexWrap: 'wrap' }}>
              <input
                placeholder="Tim theo ten linh kien..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="filter-input"
                style={{ flex: '1 1 200px', minWidth: '200px', height: '36px' }}
              />

              <select
                className="filter-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ flex: '0 0 auto', width: '180px', height: '36px' }}
              >
                <option value="all">Tat ca danh muc</option>
                {categories.map((c) => (
                  <option key={c._id || c.name} value={c._id || ''}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                className="filter-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ flex: '0 0 auto', width: '180px', height: '36px' }}
              >
                <option value="all">Tat ca trang thai</option>
                <option value="available">Dang ranh &gt; 0</option>
                <option value="borrowed">Dang muon &gt; 0</option>
                <option value="broken">Hong &gt; 0</option>
              </select>

              <Button className="btn-reset" onClick={resetFilter} style={{ flex: '0 0 auto', width: '100px', height: '36px' }}>
                Reset
              </Button>

              <Button onClick={() => setShowRequestModal(true)} style={{ flex: '0 0 auto', width: '180px', height: '36px' }}>
                Tạo yêu cầu thiết bị ngoài
              </Button>

              <Button type="primary" onClick={fetchData} loading={loading} style={{ flex: '0 0 auto', width: '100px', height: '36px' }}>
                Tai lai
              </Button>
            </div>

            {error && (
              <div className="inventory-status error" style={{ marginBottom: 12 }}>
                {error}
              </div>
            )}

            <div className="device-table">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th style={{ width: 110 }}>Anh</th>
                    <th style={{ width: 220 }}>Ten linh kien</th>
                    <th style={{ width: 180 }}>Danh muc</th>
                    <th style={{ width: 80 }}>Tong</th>
                    <th style={{ width: 100 }}>Dang ranh</th>
                    <th style={{ width: 100 }}>Dang muon</th>
                    <th style={{ width: 80 }}>Hong</th>
                    <th style={{ width: 160 }}>Hanh dong</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.length === 0 && (
                    <tr>
                      <td colSpan="7" className="center" style={{ padding: 16 }}>
                        {loading ? 'Dang tai...' : 'Khong co du lieu'}
                      </td>
                    </tr>
                  )}

                  {visibleItems.map((item, index) => {
                    const categoryName = (() => {
                      const catField = item.category_id ?? item.category;
                      if (catField && typeof catField === 'object' && catField.name) {
                        return catField.name;
                      }
                      const catId = catField?._id || catField;
                      const found = categories.find((c) => String(c._id) === String(catId));
                      return found?.name || 'N/A';
                    })();

                    const devId = item._id || item.id || '';
                    const inputQty = qtyMap[devId] ?? 1;

                    return (
                      <tr key={item._id || index}>
                        <td className="center">{indexOfFirst + index + 1}</td>
                        <td>
                          <div className="device-image-container">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="device-image"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://via.placeholder.com/80?text=No+Image';
                                }}
                              />
                            ) : (
                              <div className="device-image-placeholder">
                                <span>No Image</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>{item.name}</td>
                        <td>{categoryName}</td>
                        <td className="center">{item.inventory?.total ?? 0}</td>
                        <td className="ok center">{item.inventory?.available ?? 0}</td>
                        <td className="warn center">{item.inventory?.borrowing ?? 0}</td>
                        <td className="error center">{item.inventory?.broken ?? 0}</td>
                        <td className="center">
                          <div className="borrow-action">
                            <input
                              type="number"
                              min="1"
                              max={item.inventory?.available ?? 0}
                              value={inputQty}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 1;
                                const maxAvailable = item.inventory?.available ?? 0;
                                setQtyMap((prev) => ({
                                  ...prev,
                                  [devId]: Math.min(val, maxAvailable),
                                }));
                              }}
                              className="borrow-qty"
                            />
                            <Button
                              size="small"
                              type="primary"
                              loading={borrowLoading === devId}
                              className="borrow-btn"
                              onClick={async () => {
                                setError('');
                                setNotice('');
                                const qty = Number(inputQty) || 1;
                                const maxAvailable = item.inventory?.available ?? 0;
                                if (qty < 1) {
                                  setError('So luong khong hop le');
                                  return;
                                }
                                if (qty > maxAvailable) {
                                  setError(`So luong muon khong duoc vuot qua so luong dang ranh (${maxAvailable})`);
                                  return;
                                }
                                try {
                                  setBorrowLoading(devId);
                                  const userString = localStorage.getItem('user');
                                  const userData = userString ? JSON.parse(userString) : null;
                                  const userId = userData?._id || userData?.id;
                                  await api.post('/request-lab', { device_id: devId, qty, user_id: userId });
                                  setShowSuccessModal(true);
                                } catch (err) {
                                  const msg = err?.message || err?.response?.data?.message || 'Gửi yêu cầu thất bại';
                                  setError(msg);
                                } finally {
                                  setBorrowLoading(null);
                                }
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

            <Modal
              open={showSuccessModal}
              onOk={() => {
                setShowSuccessModal(false);
                fetchData(); // Reload data after successful borrow
              }}
              onCancel={() => {
                setShowSuccessModal(false);
                fetchData(); // Reload data after successful borrow
              }}
              okText="Đóng"
              cancelButtonProps={{ style: { display: 'none' } }}
              centered
            >
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                <h3 style={{ marginBottom: '8px', color: '#111827' }}>Thành công!</h3>
                <p style={{ color: '#6b7280', fontSize: '16px' }}>Đã gửi yêu cầu mượn sản phẩm</p>
              </div>
            </Modal>

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

      {/* Modal tạo yêu cầu thiết bị ngoài */}
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
                        // Kiểm tra kích thước file (max 2MB)
                        if (file.size > 2 * 1024 * 1024) {
                          setRequestError('Kích thước ảnh không được vượt quá 2MB');
                          e.target.value = '';
                          return;
                        }

                        // Compress và convert to base64
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const img = new Image();
                          img.onload = () => {
                            const canvas = document.createElement('canvas');
                            let width = img.width;
                            let height = img.height;

                            // Resize nếu quá lớn (max 800px)
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

                            // Convert to base64 with compression
                            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                            setRequestFormData({ ...requestFormData, image: compressedBase64 });
                          };
                          img.src = reader.result;
                        };
                        reader.onerror = () => {
                          setRequestError('Không thể đọc file ảnh');
                        };
                        reader.readAsDataURL(file);
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
                      overflow: 'hidden'
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
                            objectFit: 'cover'
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
                            borderBottomLeftRadius: '4px'
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
              {requestError && (
                <div className="inventory-status error">
                  {requestError}
                </div>
              )}
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
              <button
                className="button-primary"
                disabled={requestSaving}
                onClick={async () => {
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
                      userId
                    };

                    await api.post('/devices', payload);
                    setShowRequestModal(false);
                    setRequestFormData({ name: '', description: '', image: '', category_id: '', total: 1 });
                    setNotice('✅ Đã tạo yêu cầu thiết bị thành công! Vui lòng chờ School Admin duyệt.');
                    await fetchData(); // Reload danh sách

                    // Tự động ẩn thông báo sau 5 giây
                    setTimeout(() => setNotice(''), 5000);
                  } catch (err) {
                    const msg = err?.response?.data?.message || err?.message || 'Tạo yêu cầu thất bại';
                    setRequestError(msg);
                  } finally {
                    setRequestSaving(false);
                  }
                }}
              >
                {requestSaving ? 'Đang lưu...' : 'Tạo yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout >
  );
};

export default DeviceListSchool;
