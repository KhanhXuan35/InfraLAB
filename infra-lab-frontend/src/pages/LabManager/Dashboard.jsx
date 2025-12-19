import { useEffect, useState } from "react";
import api from "../../services/api";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis,
  BarChart, Bar
} from "recharts";

const COLORS = {
  available: "#22c55e",
  borrowed: "#f59e0b",
  broken: "#ef4444",
  repairing: "#3b82f6",
  pending: "#facc15",
  approved: "#22c55e",
  in_progress: "#3b82f6",
  done: "#10b981",
  rejected: "#ef4444"
};

export default function LabManagerDashboard() {
  const [deviceStatus, setDeviceStatus] = useState([]);
  const [borrowReturn, setBorrowReturn] = useState([]);
  const [topBroken, setTopBroken] = useState([]);
  const [repairStatus, setRepairStatus] = useState([]);

  useEffect(() => {
    api.get("/dashboard/lab/device-status").then(res => setDeviceStatus(res.data));
    api.get("/dashboard/lab/borrow-return").then(res => setBorrowReturn(res.data));
    api.get("/dashboard/lab/top-broken-devices").then(res => setTopBroken(res.data));
    api.get("/dashboard/lab/repair-status").then(res => setRepairStatus(res.data));
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Dashboard – Lab Manager</h1>

      {/* 1. Device Status */}
      <h3>Trạng thái thiết bị trong Lab</h3>
      <PieChart width={350} height={300}>
        <Pie data={deviceStatus} dataKey="count" nameKey="_id" outerRadius={100} label>
          {deviceStatus.map((d, i) => (
            <Cell key={i} fill={COLORS[d._id]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>

      {/* 2. Borrow / Return */}
      <h3>Mượn – Trả theo tháng</h3>
      <LineChart width={600} height={300} data={borrowReturn}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line dataKey="borrow" stroke="#6366f1" />
        <Line dataKey="returned" stroke="#22c55e" />
      </LineChart>

      {/* 3. Top Broken */}
      <h3>Top thiết bị hỏng nhiều nhất</h3>
      <BarChart width={500} height={300} data={topBroken}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="totalRepairs" fill="#ef4444" />
      </BarChart>

      {/* 4. Repair Status */}
      <h3>Trạng thái sửa chữa</h3>
      <PieChart width={350} height={300}>
        <Pie data={repairStatus} dataKey="count" nameKey="_id" outerRadius={100} label>
          {repairStatus.map((d, i) => (
            <Cell key={i} fill={COLORS[d._id]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </div>
  );
}
