import express from "express";
import {
  deviceStatusLab,
  borrowReturnStats,
  topBrokenDevices,
  repairStatusStats
} from "../controllers/dashboard/labDashboardController.js";

const router = express.Router();

router.get("/lab/device-status", deviceStatusLab);
router.get("/lab/borrow-return", borrowReturnStats);
router.get("/lab/top-broken-devices", topBrokenDevices);
router.get("/lab/repair-status", repairStatusStats);

export default router;
