import BorrowLab from "../../models/BorrowLab.js";
import User from "../../models/User.js";
import Device from "../../models/Device.js";
import Notifications from "../../models/Notifications.js";

// Lấy thống kê cho User Dashboard
export const getUserStats = async (req, res) => {
  try {
    // Lấy user_id từ auth token
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User not found",
      });
    }

    // Đếm thiết bị đang mượn (chưa trả và status là borrowed hoặc return_pending)
    const borrowedDevices = await BorrowLab.find({
      student_id: userId,
      returned: false,
      status: { $in: ["borrowed", "return_pending"] },
    })
      .populate("items.device_id", "name")
      .lean();

    let totalBorrowed = 0;
    borrowedDevices.forEach((borrow) => {
      borrow.items.forEach((item) => {
        totalBorrowed += item.quantity || 0;
      });
    });

    // Đếm số yêu cầu đang chờ duyệt (status là borrowed và chưa được duyệt)
    // Giả sử yêu cầu mới có status "borrowed" và chưa được approved
    const pendingRequests = await BorrowLab.countDocuments({
      student_id: userId,
      status: "borrowed",
      returned: false,
    });

    // Đếm thông báo chưa đọc
    const unreadNotifications = await Notifications.countDocuments({
      user_id: userId,
      read: false,
    });

    return res.status(200).json({
      success: true,
      data: {
        totalBorrowed,
        pendingRequests,
        unreadNotifications,
      },
    });
  } catch (err) {
    console.error("getUserStats error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

// Lấy danh sách thiết bị đang mượn
export const getBorrowedDevices = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User not found",
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
    const userId = req.user?._id || req.user?.id;
    const limit = parseInt(req.query.limit) || 10;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User not found",
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

// Đánh dấu thông báo đã đọc
export const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User not found",
      });
    }

    const notification = await Notifications.findOne({
      _id: id,
      user_id: userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    notification.read = true;
    await notification.save();

    res.json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (err) {
    console.error("markNotificationAsRead error:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Đánh dấu tất cả thông báo đã đọc
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User not found",
      });
    }

    await Notifications.updateMany(
      { user_id: userId, read: false },
      { $set: { read: true } }
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (err) {
    console.error("markAllNotificationsAsRead error:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

