import express from "express";
import { getLabDevices } from "../../controllers/LabManager/inventoryController.js";

const router = express.Router();

// GET /api/inventory/lab
router.get("/lab", getLabDevices);

export default router;
