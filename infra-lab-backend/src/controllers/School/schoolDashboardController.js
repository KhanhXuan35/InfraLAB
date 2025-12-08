import Inventory from "../../models/Inventory.js";
import RequestsWarehouse from "../../models/RequestsWarehouse.js";
import Device from "../../models/Device.js";
import User from "../../models/User.js";
import ActivityLogs from "../../models/ActivityLogs.js";
import Repair from "../../models/Repair.js";

// Lấy thống kê highlights cho School Dashboard
export const getSchoolStats = async (req, res) => {
  try {
    // Lọc dữ liệu chỉ cho location = warehouse (theo yêu cầu school_admin)
    const warehouseInventories = await Inventory.find({
      location: "warehouse",
    }).lean();

    // 1. Tổng thiết bị = tổng trường "total" của tất cả inventory ở warehouse
    const totalDevices = warehouseInventories.reduce(
      (sum, inv) => sum + (inv.total || 0),
      0
    );

    // 2. Thiết bị đang hoạt động = tổng "available" ở warehouse
    const activeDevices = warehouseInventories.reduce(
      (sum, inv) => sum + (inv.available || 0),
      0
    );

    // 3. Yêu cầu chờ duyệt - Đếm repairs có status pending hoặc requests warehouse pending
    const pendingRepairs = await Repair.countDocuments({
      status: { $in: ['pending', 'waiting'] }
    });
    const pendingWarehouseRequests = await RequestsWarehouse.countDocuments({
      status: "pending",
    });
    const pendingRequests = pendingRepairs + pendingWarehouseRequests;

    // 4. Thiết bị hỏng/sửa - Tổng số broken trong inventories + repairs đang sửa
    let brokenDevices = warehouseInventories.reduce(
      (sum, inv) => sum + (inv.broken || 0),
      0
    );
    // Thêm số thiết bị đang trong quá trình sửa chữa
    const devicesInRepair = await Repair.countDocuments({
      status: { $in: ['in_progress', 'approved'] }
    });
    brokenDevices += devicesInRepair;

    res.json({
      success: true,
      data: {
        totalDevices,
        activeDevices,
        pendingRequests,
        brokenDevices,
      },
    });
  } catch (err) {
    console.error("getSchoolStats error:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
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

