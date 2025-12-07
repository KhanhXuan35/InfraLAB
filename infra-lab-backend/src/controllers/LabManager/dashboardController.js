import Inventory from "../../models/Inventory.js";
import ActivityLog from "../../models/ActivityLogs.js";
import Device from "../../models/Device.js";
import Repair from "../../models/Repair.js";
import BorrowLab from "../../models/BorrowLab.js";

// Lấy thống kê tổng quan
export const getDashboardStats = async (req, res) => {
  try {
    // Lấy tất cả inventory trong lab
    const inventories = await Inventory.find({ location: "lab" }).lean();

    // Tính toán thống kê
    let totalAssets = 0;
    let totalAvailable = 0;
    let totalRepair = 0;
    let totalBroken = 0;

    inventories.forEach((inv) => {
      totalAssets += inv.total || 0;
      totalAvailable += inv.available || 0;
      totalBroken += inv.broken || 0;
    });

    // Lấy số lượng đang sửa chữa từ Repair model (status = "pending")
    const repairs = await Repair.find({ status: "pending" }).lean();
    repairs.forEach((repair) => {
      totalRepair += repair.quantity || 0;
    });

    res.json({
      success: true,
      data: {
        total: totalAssets,
        available: totalAvailable,
        repair: totalRepair,
        broken: totalBroken,
      },
    });
  } catch (err) {
    console.error("getDashboardStats error:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Lấy hoạt động gần đây
export const getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Lấy các hoạt động gần đây nhất
    const activities = await ActivityLog.find()
      .populate("user_id", "name email")
      .populate("device_id", "name")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Format dữ liệu để hiển thị
    const formattedActivities = activities.map((activity) => {
      let message = "";
      let type = "info"; // info, ok, error

      switch (activity.action) {
        case "borrow":
          message = `Thiết bị "${activity.device_id?.name || "N/A"}" được mượn bởi ${activity.user_id?.name || "Người dùng"}.`;
          type = "info";
          break;
        case "return":
          message = `Thiết bị "${activity.device_id?.name || "N/A"}" được trả lại.`;
          type = "ok";
          break;
        case "broken":
        case "report_broken":
          message = `Thiết bị "${activity.device_id?.name || "N/A"}" báo hỏng.`;
          type = "error";
          break;
        case "add":
        case "create":
          message = `Thêm mới thiết bị "${activity.device_id?.name || "N/A"}".`;
          type = "ok";
          break;
        case "repair":
          message = `Thiết bị "${activity.device_id?.name || "N/A"}" đang được sửa chữa.`;
          type = "info";
          break;
        default:
          message = `${activity.action || "Hoạt động"} - ${activity.device_id?.name || "N/A"}`;
          type = "info";
      }

      return {
        id: activity._id,
        message,
        type,
        createdAt: activity.createdAt,
      };
    });

    res.json({
      success: true,
      data: formattedActivities,
    });
  } catch (err) {
    console.error("getRecentActivities error:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

