import express from "express";
import {
  createRepairRequest,
  getRepairs,
  updateRepairStatus,
} from "../../controllers/LabManager/repairController.js";

const router = express.Router();

router.post("/", createRepairRequest);          // GV tạo yêu cầu
router.get("/", getRepairs);                    // Trường xem danh sách
router.patch("/:id/status", updateRepairStatus); // Trường đổi trạng thái

export default router;
