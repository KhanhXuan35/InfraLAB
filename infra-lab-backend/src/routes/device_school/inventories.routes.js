import express from "express";
import { getInventories } from "../../controllers/School/schooladmin/schoolDeviceController.js";

const router = express.Router();

router.get("/", getInventories);

export default router;
