import express from "express";
import { getInventories } from "../../controllers/School/schoolDeviceController.js";

const router = express.Router();

router.get("/", getInventories);

export default router;
