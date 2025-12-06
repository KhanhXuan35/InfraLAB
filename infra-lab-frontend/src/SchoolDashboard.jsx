import React, { useEffect, useMemo, useState } from 'react';
import './dashboard.css';

const REQUESTS = [
  { id: 'REQ-245', teacher: 'Thay Minh', device: 'May quang pho UV-Vis', department: 'Hoa phan tich', dueDate: 'Truoc 10/12', status: 'Cho duyet', badge: 'status-pending' },
  { id: 'REQ-231', teacher: 'Co Lan', device: 'Bo cam bien sinh hoc', department: 'Cong nghe sinh hoc', dueDate: 'Truoc 08/12', status: 'Uu tien cao', badge: 'status-urgent' },
  { id: 'REQ-227', teacher: 'Thay Huy', device: 'Kinh hien vi dien tu', department: 'Vat lieu', dueDate: 'Truoc 15/12', status: 'San sang xuat', badge: 'status-ready' },
  { id: 'REQ-225', teacher: 'Co Tram', device: 'May PCR Real-Time', department: 'Sinh hoc phan tu', dueDate: 'Truoc 12/12', status: 'Cho duyet', badge: 'status-pending' },
];

const HIGHLIGHTS = [
  { label: 'Yeu cau cho duyet', value: '08', trend: '+2 yeu cau moi hom nay', color: '#fbbf24' },
  { label: 'Thiet bi san sang xuat', value: '320', trend: 'Tang 12 thiet bi', color: '#34d399' },
  { label: 'Lo hang dang giao', value: '03', trend: 'Cap nhat 2 gio truoc', color: '#38bdf8' },
];

function SchoolDashboard() {
  const [activeSection, setActiveSection] = useState('overview'); // overview | inventory
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest'); // newest | oldest
  const [categories, setCategories] = useState([]);
  const [devices, setDevices] = useState([]);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (activeSection !== 'inventory') return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const locationFilter = 'warehouse';
        const [catRes, devRes] = await Promise.all([
          fetch(`${API_BASE}/device-categories`),
          fetch(`${API_BASE}/devices?location=${locationFilter}`),
        ]);
        if (!catRes.ok) throw new Error('Khong lay duoc danh sach loai linh kien');
        if (!devRes.ok) throw new Error('Khong lay duoc danh sach thiet bi');

        const catData = await catRes.json();
        const devData = await devRes.json();
        setCategories(catData || []);
        setDevices(devData || []);
      } catch (err) {
        setError(err.message || 'Da co loi xay ra');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_BASE, activeSection]);

  const filteredDevices = useMemo(() => {
    const list = devices.filter((item) => {
      const nameMatches = (item.name || '').toLowerCase().includes(search.toLowerCase().trim());

      // Ưu tiên dùng category_id (_id) để khớp với dropdown value
      const deviceCategoryKey = (() => {
        if (item.category_id && typeof item.category_id === 'object') return String(item.category_id._id || '');
        if (item.category_id) return String(item.category_id);
        if (item.categoryId && typeof item.categoryId === 'object') return String(item.categoryId._id || '');
        if (item.categoryId) return String(item.categoryId);
        if (item.category) return String(item.category);
        return '';
      })();

      const categoryMatches =
        selectedCategoryKey === 'all' ||
        deviceCategoryKey.toLowerCase() === String(selectedCategoryKey).toLowerCase();

      return nameMatches && categoryMatches;
    });

    return list.sort((a, b) => {
      if (sort === 'newest') return new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id);
      return new Date(a.createdAt || a._id) - new Date(b.createdAt || b._id);
    });
  }, [devices, search, sort, selectedCategoryKey]);

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand">
            InFra<span>Lab</span>
          </div>

          <div>
            <div className="sidebar-menu-title">School</div>
            <div className="menu-list">
              <div
                className={`menu-item ${activeSection === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveSection('overview')}
              >
                <span className="icon">📊</span>
                <span>Tong quan</span>
              </div>
              <div
                className={`menu-item ${activeSection === 'inventory' ? 'active' : ''}`}
                onClick={() => setActiveSection('inventory')}
              >
                <span className="icon">📦</span>
                <span>Kho thiet bi</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sidebar-footer">Dang xuat</div>
      </aside>

      {/* Main */}
      <main className="main">
        <header className="main-header">
          <div className="main-title">Trung tam cung ung thiet bi InFraLab</div>
          <div className="main-user">
            <span>Xin chao, School Admin!</span>
            <div className="user-avatar" />
          </div>
        </header>

        {activeSection === 'overview' && (
          <>
            <section className="supplier-highlight">
              {HIGHLIGHTS.map((item) => (
                <div className="highlight-card" key={item.label}>
                  <div className="highlight-label">
                    <span>{item.label}</span>
                    <span role="img" aria-label="icon">
                      🔥
                    </span>
                  </div>
                  <div className="highlight-value" style={{ color: item.color }}>
                    {item.value}
                  </div>
                  <div className="highlight-trend">{item.trend}</div>
                </div>
              ))}
            </section>

            <section className="supplier-panels">
              <div className="panel-card">
                <div className="panel-title">Yeu cau moi tu giao vien</div>
                <div className="panel-subtitle">Uu tien xu ly trong 24 gio</div>

                <div className="panel-list">
                  {REQUESTS.map((req) => (
                    <div className="request-item" key={req.id}>
                      <div className="request-details">
                        <div className="request-name">
                          {req.id} · {req.teacher}
                        </div>
                        <div className="request-meta">
                          {req.device} · {req.department}
                        </div>
                        <div className="request-date">{req.dueDate}</div>
                      </div>
                      <div className={`status-pill ${req.badge}`}>{req.status}</div>
                    </div>
                  ))}
                </div>

                <div className="supplier-actions">
                  <button className="button-primary green">Duyet nhanh</button>
                  <button className="button-secondary">Xem tat ca</button>
                </div>
              </div>
            </section>
          </>
        )}

        {activeSection === 'inventory' && (
          <section className="inventory-section">
            <div className="inventory-toolbar">
              <button className="inventory-side-btn">View list of devices</button>

              <div className="inventory-actions">
                <div className="category-dropdown">
                  <label htmlFor="categorySelect">Loai linh kien:</label>
                  <select
                    id="categorySelect"
                    value={selectedCategoryKey}
                    onChange={(e) => setSelectedCategoryKey(e.target.value)}
                  >
                    <option value="all">Tat ca</option>
                    {categories.map((cat) => (
                      <option key={cat._id || cat.name} value={cat._id || ''}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="inventory-search">
                  <span className="search-icon">🔍</span>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="search"
                  />
                </div>

                <div className="inventory-sort">
                  <span>Sap xep theo</span>
                  <select value={sort} onChange={(e) => setSort(e.target.value)}>
                    <option value="newest">Moi nhat</option>
                    <option value="oldest">Cu nhat</option>
                  </select>
                </div>

                <button className="button-primary add-device-btn">Add Device</button>
              </div>
            </div>

            {loading && <div className="inventory-status">Dang tai du lieu...</div>}
            {error && !loading && <div className="inventory-status error">{error}</div>}
            {!loading && !error && filteredDevices.length === 0 && (
              <div className="inventory-status">Khong co thiet bi phu hop</div>
            )}

            {!loading && !error && filteredDevices.length > 0 && (
              <div className="device-grid">
                {filteredDevices.map((device) => (
                  <div className="device-card" key={device._id || device.id}>
                    <div className="device-thumb">
                      {device.image ? (
                        <img src={device.image} alt={device.name} />
                      ) : null}
                    </div>
                    <div className="device-name">{device.name}</div>
                    <div className="device-actions">
                      <button className="button-secondary device-update">Update</button>
                      <button className="button-secondary device-delete">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default SchoolDashboard;
