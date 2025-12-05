import express from "express";
import { getInventories } from "../../controllers/School/schoolManagerdevice.controller.js";

const router = express.Router();

router.get("/", getInventories);

export default router;
