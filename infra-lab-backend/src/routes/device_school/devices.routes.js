import express from "express";
import {
  createDeviceWithInventory,
  getDevices,
  updateDeviceWithInventory,
  deleteDeviceWithInventory
} from "../../controllers/School/schoolManagerdevice.controller.js";

const router = express.Router();

router.get("/", getDevices);
router.post("/", createDeviceWithInventory);
router.put("/:id", updateDeviceWithInventory);
router.delete("/:id", deleteDeviceWithInventory);

export default router;
