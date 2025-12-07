import express from "express";
import { getDashboardStats, getRecentActivities } from "../../controllers/LabManager/dashboardController.js";

const router = express.Router();

// GET /api/dashboard/stats - Lấy thống kê tổng quan
router.get("/stats", getDashboardStats);

// GET /api/dashboard/activities - Lấy hoạt động gần đây
router.get("/activities", getRecentActivities);

export default router;

