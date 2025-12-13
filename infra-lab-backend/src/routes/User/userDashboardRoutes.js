import express from "express";
import { checkAuthMiddleware } from "../../middlewares/authMiddleware.js";
import {
  getUserStats,
  getBorrowedDevices,
  getUserNotifications,
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

export default router;

