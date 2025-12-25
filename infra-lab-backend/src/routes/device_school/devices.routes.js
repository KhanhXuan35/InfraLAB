import express from "express";
import {
  createDeviceWithInventory,
  getDevices,
  updateDeviceWithInventory,
  deleteDeviceWithInventory,
  getPendingDevices,
  approveDevice,
  rejectDevice
} from "../../controllers/School/schooladmin/schoolDeviceController.js";

const router = express.Router();

router.get("/pending", getPendingDevices);
router.get("/", getDevices);
router.post("/", createDeviceWithInventory);
router.patch("/:id/approve", approveDevice);
router.patch("/:id/reject", rejectDevice);
router.put("/:id", updateDeviceWithInventory);
router.delete("/:id", deleteDeviceWithInventory);

export default router;
