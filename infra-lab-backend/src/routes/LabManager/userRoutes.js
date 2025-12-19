import express from "express";
import {
    getActiveStudents,
    getPendingStudents,
    getDeletedStudents,
    getStudentDetail,
    updateStudent,
    softDeleteStudent,
    approveStudents,
    hardDeleteStudent,
    restoreStudent
} from "../../controllers/LabManager/userController.js";

// Import Middleware
import { checkAuthMiddleware, authorize } from "../../middlewares/authMiddleware.js";

const router = express.Router();
// Debug log
router.use((req, res, next) => {
    console.log(`[User Routes] ${req.method} ${req.path}`);
    next();
});
// --- ÁP DỤNG MIDDLEWARE BẢO VỆ TOÀN BỘ ROUTE ---
// 1. Phải đăng nhập
router.use(checkAuthMiddleware);
// 2. Phải là Lab Manager hoặc Admin mới được truy cập các API dưới này
router.use(authorize("lab_manager"));

// --- ĐỊNH NGHĨA API ---

// 1. Lấy danh sách (PHẢI để trước route :id)
// ⭐ ROUTES CÓ QUERY PATHS PHẢI ĐẶT TRƯỚC ROUTES TỔNG QUÁT
router.get("/students/deleted", getDeletedStudents); // Tab 3: Danh sách bị vô hiệu hóa
router.get("/students/pending", getPendingStudents); // Tab 2: Danh sách chờ duyệt
router.get("/students", getActiveStudents); // Tab 1: Danh sách hoạt động

// 2. Duyệt sinh viên (PHẢI để trước route :id)
router.post("/approve", approveStudents);

// 3. Thao tác chi tiết với ID (PHẢI để sau các route cụ thể)
router.patch("/:id/soft-delete", softDeleteStudent); // Xóa mềm
router.patch("/:id/hard-delete", hardDeleteStudent); // Xóa cứng
router.patch("/:id/restore", restoreStudent); // Khôi phục
router.get("/:id", getStudentDetail);       // Xem chi tiết (Popup)
router.put("/:id", updateStudent);          // Cập nhật (Popup Save)

export default router;