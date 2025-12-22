import express from "express";
import {
  getSchoolStats,
  getTeacherRequests,
  getWarehouseStats,
  getReportsData,
} from "../../controllers/School/schoolDashboardController.js";

const router = express.Router();

// GET /api/school-dashboard/stats - Lấy thống kê highlights
router.get("/stats", getSchoolStats);

// GET /api/school-dashboard/requests - Lấy yêu cầu từ giáo viên
router.get("/requests", getTeacherRequests);

// GET /api/school-dashboard/warehouse-stats - Lấy thống kê kho
router.get("/warehouse-stats", getWarehouseStats);

// GET /api/school-dashboard/reports - Lấy dữ liệu báo cáo
router.get("/reports", getReportsData);

export default router;

