import React, { useEffect, useState } from "react";
import { Layout, Menu, Typography, Button } from "antd";
import {
  DashboardOutlined,
  ToolOutlined,
  AppstoreOutlined,
  SwapOutlined,
  FileTextOutlined,
  BellOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./deviceList.css";

const { Sider, Content } = Layout;

function DeviceList() {
  const [devices, setDevices] = useState([]);
  const [allDevices, setAllDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // FILTER STATES
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");

  // DATA FROM API
  const [categories, setCategories] = useState([]);

  // PAGINATION
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const devicesResponse = await api.get('/inventory/lab');
        if (devicesResponse.data) {
          setDevices(devicesResponse.data || []);
          setAllDevices(devicesResponse.data || []);
        }

        const categoriesResponse = await api.get('/categories');
        if (categoriesResponse.data) {
          setCategories(categoriesResponse.data || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (allDevices.length === 0) return;

    let filtered = [...allDevices];

    if (search.trim() !== "") {
      filtered = filtered.filter((d) =>
        d.device.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (category !== "all") {
      filtered = filtered.filter((d) => d.device.category === category);
    }

    if (status !== "all") {
      if (status === "available") filtered = filtered.filter((d) => d.available > 0);
      if (status === "borrowed") filtered = filtered.filter((d) => d.borrowed > 0);
      if (status === "broken") filtered = filtered.filter((d) => d.broken > 0);
    }

    setDevices(filtered);
    setCurrentPage(1);
  }, [search, category, status, allDevices]);

  const applyFilter = () => {
    let filtered = [...allDevices];

    if (category !== "all") {
      filtered = filtered.filter((d) => d.device.category === category);
    }

    if (status !== "all") {
      switch (status) {
        case "available":
          filtered = filtered.filter((d) => d.available > 0);
          break;
        case "borrowed":
          filtered = filtered.filter((d) => d.borrowed > 0);
          break;
        case "broken":
          filtered = filtered.filter((d) => d.broken > 0);
          break;
        default:
          break;
      }
    }

    setDevices(filtered);
    setCurrentPage(1);
  };

  const resetFilter = () => {
    setSearch("");
    setCategory("all");
    setStatus("all");
    setDevices(allDevices);
    setCurrentPage(1);
  };

  const filteredData = devices;

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;

  const visibleItems = filteredData.slice(indexOfFirst, indexOfLast);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        width={240}
        style={{
          background: "#001529",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          overflow: "auto",
        }}
      >
        <div
          style={{
            padding: 24,
            textAlign: "center",
            borderBottom: "1px solid #e6e1e1ff",
          }}
        >
          <Typography.Title level={4} style={{ color: "#fff", margin: 0 }}>
            InFra<span style={{ color: "#1890ff" }}>Lab</span>
          </Typography.Title>
          <Typography.Text type="secondary" style={{ color: "#8c8c8c", fontSize: 12 }}>
            QUAN LY PHONG LAB
          </Typography.Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={["devices"]}
          items={[
            { key: "overview", icon: <DashboardOutlined />, label: "Thống kê" },
            { key: "devices", icon: <ToolOutlined />, label: "Quản lý thiết bị" },
            { key: "borrow", icon: <SwapOutlined />, label: "Danh sách thiết bị mượn" },
            { key: "school-inventory", icon: <AppstoreOutlined />, label: "Kho School" },
            { key: "repairs", icon: <ToolOutlined />, label: "Danh sách sửa chữa" },
            { key: "reports", icon: <FileTextOutlined />, label: "Báo cáo" },
            { key: "notifications", icon: <BellOutlined />, label: "Thông báo" },
          ]}
          style={{ borderRight: 0, marginTop: 16 }}
          onSelect={({ key }) => {
            if (key === "overview") navigate("/teacher-dashboard");
            else if (key === "devices") navigate("/lab-manager/devices");
            else if (key === "school-inventory") navigate("/lab-manager/school-devices");
            else if (key === "borrow") navigate("/lab-manager/devices");
            else if (key === "repairs") navigate("/lab-manager/repairs");
            else if (key === "reports") navigate("/reports");
            else if (key === "notifications") navigate("/notifications");
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: 16,
            borderTop: "1px solid #303030",
            cursor: "pointer",
          }}
          onClick={() => {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
            navigate("/login");
          }}
        >
          <Button
            type="text"
            icon={<LogoutOutlined />}
            style={{ width: "100%", color: "#fff" }}
          >
            Dang xuat
          </Button>
        </div>
      </Sider>

      <Layout style={{ marginLeft: 240, background: "#0c1424" }}>
        <Layout.Content style={{ padding: "16px 24px", background: "#f3f5f8ff" }}>
          <div className="content-wrapper">
            <h2 className="page-title">Danh sach thiet bi phong Lab</h2>

            <div className="filter-bar">
              <input
                placeholder="Tim theo ten thiet bi..."
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
                  <option key={c._id} value={c.name}>
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

              <button className="btn-filter" onClick={applyFilter}>Loc</button>
              <button className="btn-reset" onClick={resetFilter}>Reset</button>
            </div>

            <div className="device-table">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th style={{ width: 100 }}>Anh</th>
                    <th style={{ width: 220 }}>Ten thiet bi</th>
                    <th style={{ width: 180 }}>Danh muc</th>
                    <th style={{ width: 70 }}>Tong</th>
                    <th style={{ width: 90 }}>Dang ranh</th>
                    <th style={{ width: 90 }}>Dang muon</th>
                    <th style={{ width: 70 }}>Hong</th>
                    <th style={{ width: 120 }}>Hanh dong</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleItems.length === 0 && (
                    <tr>
                      <td colSpan="9" className="center" style={{ padding: 16 }}>
                        {loading ? "Dang tai du lieu..." : "Khong co thiet bi phu hop bo loc."}
                      </td>
                    </tr>
                  )}

                  {visibleItems.map((item, index) => (
                    <tr key={item._id}>
                      <td className="center">{indexOfFirst + index + 1}</td>
                      <td className="center">
                        <div className="device-image-container">
                          {item.device.image ? (
                            <img
                              src={item.device.image}
                              alt={item.device.name}
                              className="device-image"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/60x60?text=No+Image';
                              }}
                            />
                          ) : (
                            <div className="device-image-placeholder">
                              <span>No Image</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>{item.device.name}</td>
                      <td>{item.device.category}</td>
                      <td className="center">{item.total}</td>
                      <td className="ok center">{item.available}</td>
                      <td className="warn center">{item.borrowed}</td>
                      <td className="error center">{item.broken}</td>
                      <td className="center">
                        <button
                          onClick={() => navigate(`/lab-manager/device/${item._id}`)}
                          className="btn-view"
                        >
                          Chi tiet
                        </button>
                      </td>
                    </tr>
                  ))}
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
                    ? "0 items"
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
                    className={`page-number ${currentPage === i + 1 ? "active" : ""}`}
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
}

export default DeviceList;
