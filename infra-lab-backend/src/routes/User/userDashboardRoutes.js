import express from "express";
import { checkAuthMiddleware } from "../../middlewares/authMiddleware.js";
import {
  getUserStats,
  getBorrowedDevices,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../controllers/User/userDashboardController.js";

const router = express.Router();

// Tất cả routes đều yêu cầu authentication
router.use(checkAuthMiddleware);

// GET /api/user-dashboard/stats - Lấy thống kê user
router.get("/stats", getUserStats);

// GET /api/user-dashboard/borrowed - Lấy thiết bị đang mượn
router.get("/borrowed", getBorrowedDevices);

// GET /api/user-dashboard/notifications - Lấy thông báo
router.get("/notifications", getUserNotifications);

// PATCH /api/user-dashboard/notifications/:id/read - Đánh dấu thông báo đã đọc
router.patch("/notifications/:id/read", markNotificationAsRead);

// PATCH /api/user-dashboard/notifications/read-all - Đánh dấu tất cả thông báo đã đọc
router.patch("/notifications/read-all", markAllNotificationsAsRead);

export default router;

