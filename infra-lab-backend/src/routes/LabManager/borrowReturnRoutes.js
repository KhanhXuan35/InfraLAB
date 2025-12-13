import express from "express";
import { checkAuthMiddleware, authorize } from "../../middlewares/authMiddleware.js";
import {
  getBorrowingStudents,
  recordReturn,
  requestReturn,
  recordRepairedReturn,
} from "../../controllers/LabManager/borrowReturnController.js";

const router = express.Router();

// Tất cả routes yêu cầu authentication và chỉ lab_manager
router.use(checkAuthMiddleware);
router.use(authorize("lab_manager"));

// GET /api/lab-manager/borrow-return/students - Lấy danh sách sinh viên đang mượn
router.get("/students", getBorrowingStudents);

// POST /api/lab-manager/borrow-return/request - Yêu cầu trả thiết bị quá hạn
router.post("/request", requestReturn);

// POST /api/lab-manager/borrow-return/return - Ghi nhận trả thiết bị
router.post("/return", recordReturn);

// POST /api/lab-manager/borrow-return/repaired - Ghi nhận trả thiết bị đã sửa chữa
router.post("/repaired", recordRepairedReturn);

export default router;

