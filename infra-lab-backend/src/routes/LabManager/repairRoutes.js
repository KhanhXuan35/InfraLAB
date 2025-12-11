// routes/LabManager/repairRoutes.js
import express from "express";
import {
  createRepairRequest,
  getRepairs,
  getRepairById,
  getMyRepairRequests,
  updateRepairStatus,
  getRepairByDevice,
} from "../../controllers/LabManager/repairController.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // hoặc diskStorage

router.post("/", upload.single("image"), createRepairRequest);

// Lab Manager tạo request
router.post("/", createRepairRequest);

// Lấy repair theo device (PHẢI ĐƯA LÊN TRƯỚC)
router.get("/device/:deviceId", getRepairByDevice);

// Lấy danh sách yêu cầu theo user
router.get("/my", getMyRepairRequests);

// School Admin/Lab Manager xem list
router.get("/", getRepairs);

// Chi tiết 1 request
router.get("/:id", getRepairById);

// Cập nhật trạng thái request
router.patch("/:id/status", updateRepairStatus);

export default router;
