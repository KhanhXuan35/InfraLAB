import express from "express";
import { getDevices } from "../../controllers/School/schoolManagerdevice.controller.js";

const router = express.Router();

router.get("/", getDevices);

export default router;
