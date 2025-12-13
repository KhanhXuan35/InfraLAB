import express from "express";
import { createBorrowRequest, getLoanDeviceList, getDeviceBorrowHistory } from "../controllers/User/borrowController.js";
import { checkAuthMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Sinh viên gửi yêu cầu mượn
router.post("/", checkAuthMiddleware, createBorrowRequest);

// Lấy lịch sử mượn của một thiết bị (chỉ của người khác) - Phải đặt trước route "/"
router.get("/device/:deviceId/history", checkAuthMiddleware, getDeviceBorrowHistory);

// Lấy danh sách thiết bị đã mượn (cho student và lab_manager)
router.get("/", checkAuthMiddleware, getLoanDeviceList);

export default router;

