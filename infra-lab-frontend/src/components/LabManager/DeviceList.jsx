import React, { useEffect, useState } from "react";
import "./deviceList.css";

function DeviceList() {
  const [devices, setDevices] = useState([]);
  const [allDevices, setAllDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  // FILTER STATES
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all"); // rảnh / mượn / hỏng

  // DATA FROM API
  const [categories, setCategories] = useState([]);

  // PAGINATION
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetch("http://localhost:5000/api/inventory/lab")
      .then((res) => res.json())
      .then((json) => {
        setDevices(json.data || []);
        setAllDevices(json.data || []);
      })
      .finally(() => setLoading(false));

    fetch("http://localhost:5000/api/categories")
      .then((res) => res.json())
      .then((json) => setCategories(json.data || []));
  }, []);
  // 🔍 Realtime Search
  useEffect(() => {
    let filtered = [...allDevices];

    // Search only (realtime)
    if (search.trim() !== "") {
      filtered = filtered.filter((d) =>
        d.device.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply category filter if user selected
    if (category !== "all") {
      filtered = filtered.filter((d) => d.device.category === category);
    }

    // Apply status filter
    if (status !== "all") {
      if (status === "available") filtered = filtered.filter((d) => d.available > 0);
      if (status === "borrowed") filtered = filtered.filter((d) => d.borrowed > 0);
      if (status === "broken") filtered = filtered.filter((d) => d.broken > 0);
    }

    setDevices(filtered);
    setCurrentPage(1);
  }, [search]);

  // -------------------- FILTER FUNCTION --------------------
  const applyFilter = () => {
    let filtered = [...allDevices];


    // Category
    if (category !== "all") {
      filtered = filtered.filter((d) => d.device.category === category);
    }

    // Status filter
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
    setCurrentPage(1); // RESET PAGE AFTER FILTER
  };

  const resetFilter = () => {
    setSearch("");
    setCategory("all");
    setStatus("all");
    setDevices(allDevices);
    setCurrentPage(1);
  };

  // -------------------- PAGINATION LOGIC --------------------
  const filteredData = devices;

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;

  const visibleItems = filteredData.slice(indexOfFirst, indexOfLast);

  if (loading) return <div className="content-wrapper">Đang tải...</div>;

  return (
    <div className="content-wrapper">

      <h2 className="page-title">Danh sách thiết bị phòng Lab</h2>

      {/* ---------------- FILTER BAR ---------------- */}
      <div className="filter-bar">

        <input
          placeholder="Tìm theo tên thiết bị..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filter-input"
        />

        <select
          className="filter-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">Tất cả danh mục</option>
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
          <option value="all">Tất cả trạng thái</option>
          <option value="available">Đang rảnh &gt; 0</option>
          <option value="borrowed">Đang mượn &gt; 0</option>
          <option value="broken">Hỏng &gt; 0</option>
        </select>

        <button className="btn-filter" onClick={applyFilter}>Lọc</button>
        <button className="btn-reset" onClick={resetFilter}>Reset</button>
      </div>

      {/* ---------------- TABLE ---------------- */}
      <div className="device-table">
        <table>
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th style={{ width: 220 }}>Tên thiết bị</th>
              <th style={{ width: 180 }}>Danh mục</th>
              <th style={{ width: 70 }}>Tổng</th>
              <th style={{ width: 90 }}>Đang rảnh</th>
              <th style={{ width: 90 }}>Đang mượn</th>
              <th style={{ width: 70 }}>Hỏng</th>
              <th style={{ width: 120 }}>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {visibleItems.length === 0 && (
              <tr>
                <td colSpan="8" className="center" style={{ padding: 16 }}>
                  Không có thiết bị phù hợp bộ lọc.
                </td>
              </tr>
            )}

            {visibleItems.map((item, index) => (
              <tr key={item._id}>
                <td className="center">{indexOfFirst + index + 1}</td>
                <td>{item.device.name}</td>
                <td>{item.device.category}</td>
                <td className="center">{item.total}</td>
                <td className="ok center">{item.available}</td>
                <td className="warn center">{item.borrowed}</td>
                <td className="error center">{item.broken}</td>
                <td className="center">
                  <button className="btn-view">Xem</button>
                  <button className="btn-edit">Sửa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---------------- PAGINATION ---------------- */}
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
  );
}

export default DeviceList;
