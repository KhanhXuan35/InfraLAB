import express from "express";
import multer from "multer";

import {
  createRepairRequest,
  getRepairs,
  getRepairById,
  getMyRepairRequests,
  updateRepairStatus,
  getRepairByDevice,
  getRepairHistoryByInstance
} from "../../controllers/LabManager/repairController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ⭐ Route tạo yêu cầu sửa chữa (FE gọi POST /api/repairs)
router.post("/", upload.single("image"), createRepairRequest);

// ⭐ Lấy repair theo device
router.get("/device/:deviceId", getRepairByDevice);

// ⭐ Yêu cầu của người dùng
router.get("/my", getMyRepairRequests);

// ⭐ Danh sách
router.get("/", getRepairs);

// ⭐ Chi tiết yêu cầu
router.get("/:id", getRepairById);

// ⭐ Admin update status
router.patch("/:id/status", updateRepairStatus);


router.get("/instance/:deviceInstanceId", getRepairHistoryByInstance);
export default router;
