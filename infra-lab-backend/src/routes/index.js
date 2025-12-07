import express from "express";
import authRoute from "./common/authRoute.js";
import { getAllDevices, getDeviceById } from "../controllers/deviceController.js";
import { getAllCategories, getCategoryById } from "../controllers/categoryController.js";

const router = express.Router();
router.use("/auth", authRoute);

// Device routes
router.get("/devices", getAllDevices);
router.get("/devices/:id", getDeviceById);

// Category routes
router.get("/categories", getAllCategories);
router.get("/categories/:id", getCategoryById);

export default router;