import express from "express";
import {
  approveRequest,
  createRequest,
  listRequests,
  rejectRequest,
} from "../../controllers/LabManager/requestlab.js";

const router = express.Router();

router.post("/", createRequest); // Lab manager tạo yêu cầu
router.get("/", listRequests); // School admin xem danh sách
router.patch("/:id/approve", approveRequest);
router.patch("/:id/reject", rejectRequest);

export default router;
