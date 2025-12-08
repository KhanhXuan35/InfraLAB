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
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
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
      
      // Debug: Log để kiểm tra category_id có được populate không
      console.log('=== DEBUG DEVICES DATA ===');
      console.log('First device:', devicesList[0]);
      console.log('First device category_id:', devicesList[0]?.category_id);
      console.log('First device category_id type:', typeof devicesList[0]?.category_id);
      console.log('First device category_id name:', devicesList[0]?.category_id?.name);
      console.log('Categories list:', categoriesList);
      console.log('========================');
      
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
    if (!devices || !Array.isArray(devices)) {
      return [];
    }
    
    const list = devices.filter((item) => {
      if (!item) return false;
      
      // Filter by name
      const nameMatches = (item.name || '').toLowerCase().includes((search || '').toLowerCase().trim());

      // Filter by category - handle both populated object and ID string
      let deviceCategoryId = '';
      
      if (item.category) {
        // If category_id is populated object (from populate) - most common case
        if (typeof item.category === 'object' && item.category !== null) {
          // Check if it has _id property (populated object from MongoDB)
          if (item.category._id) {
            // Handle both ObjectId and string
            deviceCategoryId = item.category._id.toString ? item.category._id.toString() : String(item.category._id);
          }
          // If it's an object but no _id, it might be the ID itself
          else if (item.category.toString) {
            deviceCategoryId = item.category.toString();
          }
          else {
            deviceCategoryId = String(item.category._id);
          }
        } 
        // If category_id is just an ID string
        else if (typeof item.category._id === 'string') {
          deviceCategoryId = item.category._id;
        }
        // Fallback for other formats
        else {
          deviceCategoryId = String(item.category._id);
        }
      }

      // Normalize both IDs for comparison - remove any whitespace and convert to string
      const normalizedDeviceCategoryId = deviceCategoryId ? deviceCategoryId.trim().toLowerCase() : '';
      const normalizedSelectedCategoryKey = selectedCategoryKey ? String(selectedCategoryKey).trim().toLowerCase() : '';

      const categoryMatches =
        selectedCategoryKey === 'all' || 
        (normalizedDeviceCategoryId && normalizedDeviceCategoryId === normalizedSelectedCategoryKey);

      return nameMatches && categoryMatches;
    });

    return list.sort((a, b) => {
      if (sort === 'newest') return new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id);
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
    setError(null);
    try {
      const payload = {
        ...formData,
        total: Number(formData.total) || 0,
        available: formData.available === '' ? undefined : Math.max(Number(formData.available) || 0, 0),
        broken: Number(formData.broken) || 0
      };
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${API_BASE}/devices/${editingId}` : `${API_BASE}/devices`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const msg = (await res.json().catch(() => ({}))).message || 'Khong them duoc thiet bi';
        throw new Error(msg);
      }
      setShowAddModal(false);
      resetForm();
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(err.message || 'Da co loi xay ra');
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
          <div className="main-title">Trung Tâm Quản Lý Linh Kiện InFraLab</div>
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
                  <label htmlFor="categorySelect">Loại linh kiện:</label>
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
                      <th>#</th>
                      <th>Ten Thiet Bi</th>
                      <th>Danh Muc</th>
                      <th>Tong</th>
                      <th>Dang Ranh</th>
                      <th>Dang Muon</th>
                      <th>Hong</th>
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
                      if (device.category) {
                        if (typeof device.category === 'object' && device.category !== null && device.category.name) {
                          categoryName = device.category.name;
                        } else {
                          // If it's just an ID, try to find in categories list
                          const category = categories.find(cat => 
                            cat && (String(cat._id) === String(device.category))
                          );
                          categoryName = category?.name || 'N/A';
                        }
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
                              <button className="btn-view">Xem</button>
                              <button className="btn-edit" onClick={() => openEdit(device)}>Sua</button>
                              <button className="btn-delete" onClick={() => handleDelete(device)}>Xoa</button>
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

      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Them thiet bi</h3>
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
                <label>Hinh anh (URL)</label>
                <input
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://..."
                />
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
                    value={formData.available}
                    onChange={(e) => setFormData({ ...formData, available: e.target.value })}
                  />
                </div>
                <div>
                  <label>Hong</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.broken}
                    onChange={(e) => setFormData({ ...formData, broken: e.target.value })}
                  />
                </div>
              </div>
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
              {error && <div className="inventory-status error">{error}</div>}
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