import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../dashboard.css';

function SchoolDashboard() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('inventory');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [categories, setCategories] = useState([]);
  const [devices, setDevices] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingDevice, setViewingDevice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    category_id: '',
    total: 0,
    available: '',
    broken: 0,
    location: 'warehouse'
  });

  // Lấy userId từ localStorage
  const userString = localStorage.getItem('user');
  const userId = userString ? JSON.parse(userString)?._id : null;


  // init state: khoi tao init
  // useeffect : call api be luu vao state
  // show state ra la dc

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const loadData = async () => {
    if (activeSection !== 'inventory') return;
    setLoading(true);
    setError(null);
    try {
      const locationFilter = 'warehouse';
      const [catRes, devRes] = await Promise.all([
        fetch(`${API_BASE}/device-categories`),
        fetch(`${API_BASE}/devices?location=${locationFilter}`)
      ]);
      if (!catRes.ok) throw new Error('Khong lay duoc danh sach loai linh kien');
      if (!devRes.ok) throw new Error('Khong lay duoc danh sach thiet bi');

      const catData = await catRes.json();
      const devData = await devRes.json();

      // Handle different response formats
      const categoriesList = Array.isArray(catData) ? catData : (catData?.data || []);
      const devicesList = Array.isArray(devData) ? devData : (devData?.data || []);
      setCategories(categoriesList);
      setDevices(devicesList);

      const invRes = await fetch(`${API_BASE}/inventories`);
      if (invRes.ok) {
        const invData = await invRes.json();
        // Handle different response formats
        const inventoriesList = Array.isArray(invData) ? invData : (invData?.data || []);
        setInventories(inventoriesList);
      }
    } catch (err) {
      setError(err.message || 'Da co loi xay ra');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

const filteredDevices = useMemo(() => {
  if (!Array.isArray(devices)) return [];

  const list = devices.filter((item) => {
    if (!item) return false;

    const nameMatches = (item.name || '')
      .toLowerCase()
      .includes((search || '').toLowerCase().trim());

    // Lấy category từ category_id hoặc category (object hoặc id)
    const catField = item.category_id ?? item.category;
    const deviceCategoryId =
      catField && typeof catField === 'object'
        ? catField._id ?? catField // populated object hoặc obj {_id}
        : catField;                // id dạng string/number

    const normalizedDeviceCategoryId = deviceCategoryId
      ? String(deviceCategoryId).trim().toLowerCase()
      : '';
    const normalizedSelectedCategoryKey = selectedCategoryKey
      ? String(selectedCategoryKey).trim().toLowerCase()
      : '';

    const categoryMatches =
      selectedCategoryKey === 'all' ||
      (normalizedDeviceCategoryId &&
        normalizedDeviceCategoryId === normalizedSelectedCategoryKey);

    return nameMatches && categoryMatches;
  });

  return list.sort((a, b) => {
    if (sort === 'newest')
      return new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id);
    return new Date(a.createdAt || a._id) - new Date(b.createdAt || b._id);
  });
}, [devices, search, sort, selectedCategoryKey]);


  const resetForm = () =>
    setFormData({
      name: '',
      description: '',
      image: '',
      category_id: '',
      total: 0,
      available: '',
      broken: 0,
      location: 'warehouse'
    });

  const openView = (device) => {
    const devId = device._id || device.id || '';
    const inv = inventories.find((i) => {
      const iDev = i.device_id?._id || i.device_id || '';
      return String(iDev) === String(devId);
    });

    // Get category name
    let categoryName = 'N/A';
    const catField = device.category_id ?? device.category;
    if (catField && typeof catField === 'object' && catField.name) {
      categoryName = catField.name;
    } else {
      const catId = catField?._id || catField;
      const found = categories.find(cat => String(cat._id) === String(catId));
      categoryName = found?.name || 'N/A';
    }

    const total = inv?.total ?? 0;
    const available = inv?.available ?? 0;
    const broken = inv?.broken ?? 0;
    const borrowing = Math.max(total - available - broken, 0);

    setViewingDevice({
      ...device,
      categoryName,
      total,
      available,
      broken,
      borrowing,
      location: inv?.location || 'warehouse'
    });
    setShowViewModal(true);
  };

  const openEdit = (device) => {
    const devId = device._id || device.id || '';
    const inv = inventories.find((i) => {
      const iDev = i.device_id?._id || i.device_id || '';
      return String(iDev) === String(devId);
    });

    setFormData({
      name: device.name || '',
      description: device.description || '',
      image: device.image || '',
      category_id: device.category_id?._id || '',
      total: inv?.total ?? 0,
      available: inv?.available ?? '',
      broken: inv?.broken ?? 0,
      location: inv?.location || 'warehouse'
    });
    setEditingId(devId);
    setShowAddModal(true);
  };

  const handleDelete = async (device) => {
    const devId = device._id || device.id || '';
    if (!devId) return;
    const ok = window.confirm(`Xoa thiet bi "${device.name}"?`);
    if (!ok) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/devices/${devId}`, { method: 'DELETE' });
      if (!res.ok) {
        const msg = (await res.json().catch(() => ({}))).message || 'Khong xoa duoc thiet bi';
        throw new Error(msg);
      }
      await loadData();
    } catch (err) {
      setError(err.message || 'Da co loi xay ra');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setModalError(null);
    try {
      // Validation khi sửa
      if (editingId) {
        const total = Number(formData.total) || 0;
        const available = Number(formData.available) || 0;
        const broken = Number(formData.broken) || 0;

        if (available < 0 || broken < 0) {
          setModalError('So luong khong duoc am');
          setSaving(false);
          return;
        }
        if (available + broken > total) {
          setModalError('Tong dang ranh + hong khong duoc vuot qua tong');
          setSaving(false);
          return;
        }
      }

      const payload = editingId ? {
        name: formData.name,
        description: formData.description || '',
        image: formData.image || '',
        category_id: formData.category_id,
        total: Number(formData.total) || 0,
        available: formData.available === '' ? undefined : Math.max(Number(formData.available) || 0, 0),
        broken: Number(formData.broken) || 0,
        location: formData.location || 'warehouse',
        userId
      } : {
        name: formData.name,
        description: formData.description || '',
        image: formData.image || '',
        category_id: formData.category_id,
        total: Number(formData.total) || 0,
        location: formData.location || 'warehouse',
        userId
      };

      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${API_BASE}/devices/${editingId}` : `${API_BASE}/devices`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)  // gửi cho backend
      });
      if (!res.ok) {
        const msg = (await res.json().catch(() => ({}))).message || 'Khong them duoc thiet bi';
        throw new Error(msg);
      }
      setShowAddModal(false);
      resetForm();
      setEditingId(null);
      setModalError(null);
      await loadData();
    } catch (err) {
      setModalError(err.message || 'Da co loi xay ra');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <div
            className="brand"
            onClick={() => {
              // Navigate về trang chủ theo role
              const userString = localStorage.getItem('user');
              if (userString) {
                const userData = JSON.parse(userString);
                const role = userData?.role;
                if (role === 'school_admin') {
                  navigate('/school-dashboard');
                } else if (role === 'lab_manager') {
                  navigate('/teacher-dashboard');
                } else if (role === 'student') {
                  navigate('/user-dashboard');
                } else {
                  navigate('/school-dashboard'); // Default
                }
              } else {
                navigate('/school-dashboard'); // Default nếu không có user
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            InFra<span>Lab</span>
          </div>

          <div>
            <div className="sidebar-menu-title">School</div>
            <div className="menu-list">
              <div
                className={`menu-item ${activeSection === 'inventory' ? 'active' : ''}`}
                onClick={() => setActiveSection('inventory')}
              >
                <span>📦 Kho Thiết Bị</span>
              </div>
            </div>
          </div>
        </div>

        <div
          className="sidebar-footer"
          onClick={() => {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            navigate('/login');
          }}
          style={{ cursor: 'pointer' }}
        >
          Đăng xuất
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        <header className="main-header">
          <div className="main-title">Quản lý kho thiết bị InFraLab</div>
          <div className="main-header-right">
            <div className="header-search">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm thiết bị theo tên..."
                className="header-search-input"
              />
            </div>
            <div
              className="main-user"
              onClick={() => navigate('/profile')}
              style={{ cursor: 'pointer' }}
            >
              <span>Xin chao, School Admin!</span>
              <div className="user-avatar" />
            </div>
          </div>
        </header>

        {activeSection === 'inventory' && (
          <section className="inventory-section">
            <div className="inventory-toolbar">
              <button className="inventory-side-btn">View list of devices</button>

              <div className="inventory-actions">
                <div className="category-dropdown">
                  <label htmlFor="categorySelect">Danh Mục</label>
                  <select
                    id="categorySelect"
                    value={selectedCategoryKey}
                    onChange={(e) => setSelectedCategoryKey(e.target.value)}
                  >
                    <option value="all">Tất Cả</option>
                    {categories.map((cat) => (
                      <option key={cat._id || cat.name} value={cat._id || ''}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="inventory-search">
                  <span className="search-icon">?</span>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="search"
                  />
                </div>

                <div className="inventory-sort">
                  <span>Sắp Xếp Theo</span>
                  <select value={sort} onChange={(e) => setSort(e.target.value)}>
                    <option value="newest">Mới Nhất</option>
                    <option value="oldest">Cũ Nhất</option>
                  </select>
                </div>

                <button className="button-primary add-device-btn" onClick={() => setShowAddModal(true)}>
                  Thêm Thiết Bị
                </button>
              </div>
            </div>

            {loading && <div className="inventory-status">Dang tai du lieu...</div>}
            {error && !loading && <div className="inventory-status error">{error}</div>}
            {!loading && !error && filteredDevices.length === 0 && (
              <div className="inventory-status">Khong co thiet bi phu hop</div>
            )}
            {!loading && !error && filteredDevices.length > 0 && (
              <div className="device-table-wrapper">
                <table className="device-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Tên Thiết Bị</th>
                      <th>Danh Mục</th>
                      <th>Tổng Thiết Bị</th>
                      <th>Có thể mượn</th>
                      <th>Đã mượn</th>
                      <th>Hỏng</th>
                      <th>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDevices.map((device, idx) => {
                      const devId = device._id || device.id || '';
                      const inv = inventories.find((i) => {
                        const iDev = i.device_id?._id || i.device_id || '';
                        return String(iDev) === String(devId);
                      });
                      const total = inv?.total ?? 0;
                      const available = inv?.available ?? 0;
                      const broken = inv?.broken ?? 0;
                      const borrowing = Math.max(total - available - broken, 0);
                      // Get category name - handle both populated object and ID
                      let categoryName = 'N/A';
                      const catField = device.category_id ?? device.category;
                      if (catField && typeof catField === 'object' && catField.name) {
                        categoryName = catField.name;
                      } else {
                        const catId = catField?._id || catField;
                        const found = categories.find(cat => String(cat._id) === String(catId));
                        categoryName = found?.name || 'N/A';
                      }

                      return (
                        <tr key={devId}>
                          <td>{idx + 1}</td>
                          <td className="cell-name">{device.name}</td>
                          <td>{categoryName}</td>
                          <td>{total}</td>
                          <td className="text-success">{available}</td>
                          <td className="text-warning">{borrowing}</td>
                          <td className="text-danger">{broken}</td>
                          <td>
                            <div className="table-actions">
                              <button className="btn-view" onClick={() => openView(device)}>Xem</button>
                              <button className="btn-edit" onClick={() => openEdit(device)}>Sửa</button>
                              <button className="btn-delete" onClick={() => handleDelete(device)}>Xoá</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>

      {showViewModal && viewingDevice && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Chi Tiết Thiết Bị</h3>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {viewingDevice.image && (
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <img
                    src={viewingDevice.image}
                    alt={viewingDevice.name}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '300px',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      border: '1px solid #434343'
                    }}
                  />
                </div>
              )}

              <div className="view-detail-grid">
                <div className="view-detail-item">
                  <label>Tên thiết bị:</label>
                  <span>{viewingDevice.name}</span>
                </div>

                <div className="view-detail-item">
                  <label>Danh mục:</label>
                  <span>{viewingDevice.categoryName}</span>
                </div>

                <div className="view-detail-item">
                  <label>Vị trí:</label>
                  <span style={{ textTransform: 'capitalize' }}>{viewingDevice.location}</span>
                </div>

                <div className="view-detail-item full-width">
                  <label>Mô tả:</label>
                  <span>{viewingDevice.description || 'Không có mô tả'}</span>
                </div>

                <div className="view-detail-divider"></div>

                <div className="view-detail-item">
                  <label>Tổng số lượng:</label>
                  <span className="badge badge-info">{viewingDevice.total}</span>
                </div>

                <div className="view-detail-item">
                  <label>Đang rảnh:</label>
                  <span className="badge badge-success">{viewingDevice.available}</span>
                </div>

                <div className="view-detail-item">
                  <label>Đang mượn:</label>
                  <span className="badge badge-warning">{viewingDevice.borrowing}</span>
                </div>

                <div className="view-detail-item">
                  <label>Hỏng:</label>
                  <span className="badge badge-danger">{viewingDevice.broken}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="button-secondary" onClick={() => setShowViewModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingId ? 'Sua thiet bi' : 'Them thiet bi'}</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label>Ten thiet bi</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhap ten"
                />
              </div>
              <div className="form-row">
                <label>Mo ta</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mo ta ngan"
                />
              </div>
              <div className="form-row">
                <label>Hình ảnh</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    id="school-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                          setModalError('Kích thước ảnh không được vượt quá 2MB');
                          e.target.value = '';
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
                            setFormData({ ...formData, image: compressedBase64 });
                          };
                          img.src = reader.result;
                        };
                        reader.onerror = () => {
                          setModalError('Không thể đọc file ảnh');
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="school-image-upload"
                    style={{
                      width: '100px',
                      height: '100px',
                      border: '2px dashed #434343',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: formData.image ? 'transparent' : '#1a1a1a',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {formData.image ? (
                      <>
                        <img
                          src={formData.image}
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
                            setFormData({ ...formData, image: '' });
                            document.getElementById('school-image-upload').value = '';
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
                <label>Loai linh kien</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                >
                  <option value="">Chon loai</option>
                  {categories.map((cat) => (
                    <option key={cat._id || cat.name} value={cat._id || ''}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              {editingId ? (
                // Khi sửa: hiển thị đầy đủ 3 trường
                <div className="form-row three-cols">
                  <div>
                    <label>Tong</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.total}
                      onChange={(e) => setFormData({ ...formData, total: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>Dang ranh</label>
                    <input
                      type="number"
                      min="0"
                      max={formData.total}
                      value={formData.available}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setFormData({ ...formData, available: Math.min(val, formData.total) });
                      }}
                    />
                  </div>
                  <div>
                    <label>Hong</label>
                    <input
                      type="number"
                      min="0"
                      max={formData.total}
                      value={formData.broken}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setFormData({ ...formData, broken: Math.min(val, formData.total) });
                      }}
                    />
                  </div>
                </div>
              ) : (   // phân biệt giưa thêm và sửa
                // Khi thêm mới: chỉ hiển thị trường Tổng
                <div className="form-row">
                  <label>Tong so luong</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.total}
                    onChange={(e) => setFormData({ ...formData, total: e.target.value })}
                    placeholder="Nhap tong so luong thiet bi"
                  />
                  <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                    Khi them moi, tat ca thiet bi se duoc danh dau la "dang ranh"
                  </small>
                </div>
              )}
              <div className="form-row">
                <label>Vi tri</label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                >
                  <option value="warehouse">warehouse</option>
                  <option value="lab">lab</option>
                </select>
              </div>
              {modalError && <div className="inventory-status error">{modalError}</div>}
            </div>
            <div className="modal-footer">
              <button className="button-secondary" onClick={() => setShowAddModal(false)} disabled={saving}>
                Huy
              </button>
              <button className="button-primary" disabled={saving} onClick={handleSubmit}>
                {saving ? 'Dang luu...' : 'Luu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SchoolDashboard;