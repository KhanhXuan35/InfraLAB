import Inventory from "../../models/Inventory.js";
import RequestsWarehouse from "../../models/RequestsWarehouse.js";
import Device from "../../models/Device.js";
import User from "../../models/User.js";
import ActivityLogs from "../../models/ActivityLogs.js";

// Lấy thống kê highlights cho School Dashboard
export const getSchoolStats = async (req, res) => {
  try {
    // Đếm yêu cầu chờ duyệt
    const pendingRequests = await RequestsWarehouse.countDocuments({
      status: "pending",
    });

    // Đếm yêu cầu mới hôm nay
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newRequestsToday = await RequestsWarehouse.countDocuments({
      status: "pending",
      createdAt: { $gte: today },
    });

    // Tính tổng thiết bị sẵn sàng xuất trong warehouse
    const warehouseInventories = await Inventory.find({
      location: "warehouse",
    }).lean();

    let totalReadyToShip = 0;
    warehouseInventories.forEach((inv) => {
      totalReadyToShip += inv.available || 0;
    });

    // Tính số thiết bị tăng so với hôm qua từ ActivityLogs
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    // Đếm số thiết bị được thêm vào warehouse trong 24 giờ qua từ ActivityLogs
    // Tìm các activity có action liên quan đến thêm thiết bị
    const todayActivities = await ActivityLogs.countDocuments({
      action: { $regex: /add|create|thêm/i },
      createdAt: { $gte: yesterday },
    });
    
    // Hoặc tính từ Inventory changes (nếu có updatedAt)
    let increaseDevices = todayActivities;
    
    // Nếu không có ActivityLogs, tính từ Inventory changes
    if (increaseDevices === 0) {
      const recentInventories = await Inventory.find({
        location: "warehouse",
        updatedAt: { $gte: yesterday },
      }).lean();
      increaseDevices = recentInventories.length;
    }

    // Đếm số lô hàng đang giao (yêu cầu đã approved nhưng chưa hoàn thành)
    const shipmentsInTransit = await RequestsWarehouse.countDocuments({
      status: "approved",
      // Có thể thêm điều kiện khác nếu có trường tracking hoặc delivery status
    });

    res.json({
      success: true,
      data: {
        pendingRequests: pendingRequests,
        newRequestsToday: newRequestsToday,
        readyToShip: totalReadyToShip,
        increaseDevices: increaseDevices,
        shipmentsInTransit: shipmentsInTransit,
      },
    });
  } catch (err) {
    console.error("getSchoolStats error:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Lấy danh sách yêu cầu từ giáo viên
export const getTeacherRequests = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || "pending"; // pending, approved, rejected

    const requests = await RequestsWarehouse.find({ status })
      .populate("lecturer_id", "name email")
      .populate("items.device_id", "name")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Format dữ liệu
    const formattedRequests = requests.map((req) => {
      // Lấy thiết bị đầu tiên trong items để hiển thị
      const firstItem = req.items[0];
      const deviceName = firstItem?.device_id?.name || "N/A";
      const quantity = firstItem?.quantity || 0;

      // Xác định status badge
      let badge = "status-pending";
      let statusText = "Chờ duyệt";
      if (req.status === "approved") {
        badge = "status-ready";
        statusText = "Sẵn sàng xuất";
      } else if (req.status === "rejected") {
        badge = "status-urgent";
        statusText = "Đã từ chối";
      }

      // Format due date (tạm thời dùng createdAt + 7 ngày)
      const dueDate = new Date(req.createdAt);
      dueDate.setDate(dueDate.getDate() + 7);
      const dueDateStr = `Trước ${dueDate.getDate()}/${dueDate.getMonth() + 1}`;

      return {
        id: `REQ-${req._id.toString().slice(-3)}`,
        teacher: req.lecturer_id?.name || "N/A",
        device: deviceName,
        department: "N/A", // Có thể thêm vào User model sau
        dueDate: dueDateStr,
        status: statusText,
        badge: badge,
        _id: req._id,
      };
    });

    res.json({
      success: true,
      data: formattedRequests,
    });
  } catch (err) {
    console.error("getTeacherRequests error:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Lấy thống kê kho warehouse
export const getWarehouseStats = async (req, res) => {
  try {
    const inventories = await Inventory.find({ location: "warehouse" }).lean();

    let readyToShip = 0;
    let underRepair = 0;
    let expectedIncoming = 0; // Tạm thời, có thể tính từ RequestsWarehouse approved

    inventories.forEach((inv) => {
      readyToShip += inv.available || 0;
    });

    // Đếm thiết bị đang sửa chữa (có thể từ Repair model)
    // Tạm thời dùng số cố định
    underRepair = 24;

    // Tính tỷ lệ sử dụng (available / total)
    let totalDevices = 0;
    inventories.forEach((inv) => {
      totalDevices += inv.total || 0;
    });
    const usageRate = totalDevices > 0 
      ? Math.round((readyToShip / totalDevices) * 100) 
      : 0;

    res.json({
      success: true,
      data: {
        readyToShip,
        underRepair,
        expectedIncoming,
        usageRate,
      },
    });
  } catch (err) {
    console.error("getWarehouseStats error:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

