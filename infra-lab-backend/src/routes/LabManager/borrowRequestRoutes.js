import express from "express";
import { createBorrowRequest } from "../../controllers/LabManager/borrowRequest/createBorrowRequest.js";
import { listBorrowRequests } from "../../controllers/LabManager/borrowRequest/listBorrowRequests.js";
import { approveBorrowRequest } from "../../controllers/LabManager/borrowRequest/approveBorrowRequest.js";
import { rejectBorrowRequest } from "../../controllers/LabManager/borrowRequest/rejectBorrowRequest.js";

const router = express.Router();

// Lab Manager tạo yêu cầu mượn thiết bị
router.post("/", createBorrowRequest);

// School Admin xem danh sách yêu cầu
router.get("/", listBorrowRequests);

// School Admin duyệt yêu cầu
router.patch("/:id/approve", approveBorrowRequest);

// School Admin từ chối yêu cầu
router.patch("/:id/reject", rejectBorrowRequest);

export default router;

