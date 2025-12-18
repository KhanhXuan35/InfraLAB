import express from "express";
import { checkAuthMiddleware, authorize } from "../../middlewares/authMiddleware.js";
import {
  getCertificates,
  getCertificateDetail,
  confirmReceive,
} from "../../controllers/LabManager/certificateController.js";

const router = express.Router();

// Lab Manager xem danh sách chứng nhận của mình
router.get(
  "/",
  checkAuthMiddleware,
  authorize("lab_manager"),
  getCertificates
);

// Xem chi tiết chứng nhận
router.get(
  "/:id",
  checkAuthMiddleware,
  getCertificateDetail
);

// Lab Manager xác nhận đã nhận thiết bị
router.post(
  "/:id/confirm-receive",
  checkAuthMiddleware,
  authorize("lab_manager"),
  confirmReceive
);

export default router;

