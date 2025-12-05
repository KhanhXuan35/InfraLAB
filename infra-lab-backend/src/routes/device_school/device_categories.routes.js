import express from "express";
import { getDeviceCategories } from "../../controllers/School/schoolManagerdevice.controller.js";

const router = express.Router();

router.get("/", getDeviceCategories);

export default router;
