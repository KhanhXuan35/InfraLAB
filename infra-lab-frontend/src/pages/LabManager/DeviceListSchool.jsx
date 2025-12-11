import React, { useEffect, useState } from 'react';
import { Layout, Menu, Typography, Button } from 'antd';
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

const { Sider, Content } = Layout;
const { Title, Text } = Typography;

const DeviceListSchool = () => {
  const navigate = useNavigate();

  const [devices, setDevices] = useState([]);
  const [allDevices, setAllDevices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    setError('');
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
        const catId = d.category?._id || d.category || '';
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

      <Layout style={{ marginLeft: 240, background: '#0c1424' }}>
        <Content style={{ padding: '16px 24px', background: '#0c1424' }}>
          <div className={`content-wrapper ${loading ? 'loading' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="page-title">Danh sach linh kien kho School</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button type="primary" onClick={fetchData} loading={loading}>
                  Tai lai
                </Button>
              </div>
            </div>

            <div className="filter-bar">
              <input
                placeholder="Tim theo ten linh kien..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="filter-input"
              />

              <select
                className="filter-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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
              >
                <option value="all">Tat ca trang thai</option>
                <option value="available">Dang ranh &gt; 0</option>
                <option value="borrowed">Dang muon &gt; 0</option>
                <option value="broken">Hong &gt; 0</option>
              </select>

              <button className="btn-reset" onClick={resetFilter}>
                Reset
              </button>
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
                      if (item.category && typeof item.category === 'object' && item.category.name) {
                        return item.category.name;
                      }
                      const found = categories.find((c) => String(c._id) === String(item.category));
                      return found?.name || 'N/A';
                    })();

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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

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
    </Layout>
  );
};

export default DeviceListSchool;
