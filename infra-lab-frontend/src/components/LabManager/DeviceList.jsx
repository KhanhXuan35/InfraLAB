// src/components/DeviceList.jsx
import React, { useEffect, useState } from "react";
import "./deviceList.css";

function DeviceList() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/inventory/lab")
      .then((res) => res.json())
      .then((json) => setDevices(json.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="content-wrapper">Đang tải danh sách thiết bị...</div>;
  }

  return (
    <div className="content-wrapper">
      <h2 className="page-title">Danh sách thiết bị phòng Lab</h2>

      <div className="device-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Tên thiết bị</th>
              <th>Danh mục</th>
              <th>Tổng</th>
              <th>Đang rảnh</th>
              <th>Đang mượn</th>
              <th>Hỏng</th>
              <th>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {devices.map((item, index) => (
              <tr key={item._id}>
                <td>{index + 1}</td>
                <td>{item.device.name}</td>
                <td>{item.device.category}</td>
                <td>{item.total}</td>
                <td className="ok">{item.available}</td>
                <td className="warn">{item.borrowed}</td>
                <td className="error">{item.broken}</td>
                <td>
                  <button className="btn-view">Xem</button>
                  <button className="btn-edit">Sửa</button>
                </td>
              </tr>
            ))}

            {devices.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: 16 }}>
                  Không có thiết bị nào trong phòng Lab.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DeviceList;
