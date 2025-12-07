import express from "express";
import { createDeviceWithInventory, getDevices } from "../../controllers/School/schoolManagerdevice.controller.js";

const router = express.Router();

router.get("/", getDevices);
router.post("/", createDeviceWithInventory);

export default router;
