import express from "express";
import { createBorrowRequest, getLoanDeviceList } from "../controllers/User/borrowController.js";
import { checkAuthMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Sinh viên gửi yêu cầu mượn
router.post("/", checkAuthMiddleware, createBorrowRequest);

// Lấy danh sách thiết bị đã mượn (cho student và lab_manager)
router.get("/", checkAuthMiddleware, getLoanDeviceList);

export default router;

