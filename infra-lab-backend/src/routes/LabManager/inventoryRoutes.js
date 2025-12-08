import express from "express";
import { getLabDevices , filterInventory } from "../../controllers/LabManager/inventoryController.js";

const router = express.Router();

// GET /api/inventory/lab
router.get("/lab", getLabDevices);
// API mới: filter đa điều kiện
router.get("/filter", filterInventory);
export default router;
