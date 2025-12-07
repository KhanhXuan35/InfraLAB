import BorrowLab from "../../models/BorrowLab.js";
import User from "../../models/User.js";
import Device from "../../models/Device.js";
import Notifications from "../../models/Notifications.js";

// Lấy thống kê cho User Dashboard
export const getUserStats = async (req, res) => {
  try {
    // Lấy user_id từ query hoặc từ auth token (tạm thời dùng query)
    const userId = req.query.userId || req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Đếm thiết bị đang mượn (chưa trả)
    const borrowedDevices = await BorrowLab.find({
      student_id: userId,
      returned: false,
    })
      .populate("items.device_id", "name")
      .lean();

    let totalBorrowed = 0;
    borrowedDevices.forEach((borrow) => {
      borrow.items.forEach((item) => {
        totalBorrowed += item.quantity || 0;
      });
    });

    // Đếm số yêu cầu đang chờ
    const pendingRequests = await BorrowLab.countDocuments({
      student_id: userId,
      status: "pending",
    });

    // Đếm thông báo chưa đọc
    const unreadNotifications = await Notifications.countDocuments({
      user_id: userId,
      read: false,
    });

    res.json({
      success: true,
      data: {
        totalBorrowed,
        pendingRequests,
        unreadNotifications,
      },
    });
  } catch (err) {
    console.error("getUserStats error:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Lấy danh sách thiết bị đang mượn
export const getBorrowedDevices = async (req, res) => {
  try {
    const userId = req.query.userId || req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const borrowedDevices = await BorrowLab.find({
      student_id: userId,
      returned: false,
    })
      .populate("items.device_id", "name image")
      .sort({ createdAt: -1 })
      .lean();

    // Format dữ liệu
    const formattedDevices = borrowedDevices.map((borrow) => {
      return {
        _id: borrow._id,
        items: borrow.items.map((item) => ({
          device_id: item.device_id._id,
          device_name: item.device_id?.name || "N/A",
          device_image: item.device_id?.image || "",
          quantity: item.quantity || 0,
        })),
        return_due_date: borrow.return_due_date,
        status: borrow.status,
        createdAt: borrow.createdAt,
      };
    });

    res.json({
      success: true,
      data: formattedDevices,
    });
  } catch (err) {
    console.error("getBorrowedDevices error:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Lấy thông báo cho user
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.query.userId || req.user?.id;
    const limit = parseInt(req.query.limit) || 10;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const notifications = await Notifications.find({
      user_id: userId,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: notifications,
    });
  } catch (err) {
    console.error("getUserNotifications error:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

