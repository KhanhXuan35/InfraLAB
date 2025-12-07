import express from "express";
import {
  getUserStats,
  getBorrowedDevices,
  getUserNotifications,
} from "../../controllers/User/userDashboardController.js";

const router = express.Router();

// GET /api/user-dashboard/stats - Lấy thống kê user
router.get("/stats", getUserStats);

// GET /api/user-dashboard/borrowed - Lấy thiết bị đang mượn
router.get("/borrowed", getBorrowedDevices);

// GET /api/user-dashboard/notifications - Lấy thông báo
router.get("/notifications", getUserNotifications);

export default router;

