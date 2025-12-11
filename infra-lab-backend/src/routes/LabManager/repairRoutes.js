// routes/LabManager/repairRoutes.js
import express from "express";
import {
  createRepairRequest,
  getRepairs,
  getRepairById,
  getMyRepairRequests,
  updateRepairStatus,
} from "../../controllers/LabManager/repairController.js";

const router = express.Router();

// Lab Manager
router.post("/", createRepairRequest);
router.get("/my", getMyRepairRequests);

// School Admin + Lab Manager xem list (có filter ?status=)
router.get("/", getRepairs);

// Chi tiết một yêu cầu
router.get("/:id", getRepairById);

// School Admin đổi trạng thái
router.patch("/:id/status", updateRepairStatus);



export default router;
