import express from "express";
import {
    getActiveStudents,
    getPendingStudents,
    getStudentDetail,
    updateStudent,
    softDeleteStudent,
    approveStudents
} from "../../controllers/LabManager/userController.js";

// Import Middleware
import { checkAuthMiddleware, authorize } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// --- ÁP DỤNG MIDDLEWARE BẢO VỆ TOÀN BỘ ROUTE ---
// 1. Phải đăng nhập
router.use(checkAuthMiddleware);
// 2. Phải là Lab Manager hoặc Admin mới được truy cập các API dưới này
router.use(authorize("lab_manager"));

// --- ĐỊNH NGHĨA API ---

// 1. Lấy danh sách
router.get("/students", getActiveStudents); // Tab 1: Danh sách hoạt động
router.get("/students/pending", getPendingStudents); // Tab 2: Danh sách chờ

// 2. Duyệt sinh viên (Tab 2 - Nút Duyệt)
router.post("/approve", approveStudents);

// 3. Thao tác chi tiết (Tab 1 - Nút View/Edit/Delete)
router.get("/:id", getStudentDetail);       // Xem chi tiết (Popup)
router.put("/:id", updateStudent);          // Cập nhật (Popup Save)
router.patch("/:id/soft-delete", softDeleteStudent); // Xóa mềm

export default router;