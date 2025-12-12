import express from "express";
import { createBorrowRequest } from "../controllers/User/borrowController.js";
import { checkAuthMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Sinh viên gửi yêu cầu mượn
router.post("/", checkAuthMiddleware, createBorrowRequest);

export default router;

