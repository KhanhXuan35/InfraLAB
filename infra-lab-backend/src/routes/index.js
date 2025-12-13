import express from "express";
import authRoute from "./common/authRoute.js";
import profileRoute from "./common/profileRoute.js";
import { getAllDevices, getDeviceById } from "../controllers/User/deviceController.js";
import { getAllCategories, getCategoryById } from "../controllers/User/categoryController.js";

const router = express.Router();
router.use("/auth", authRoute);
router.use("/profile", profileRoute);

// Device routes
router.get("/devices", getAllDevices);
router.get("/devices/:id", getDeviceById);

// Category routes
router.get("/categories", getAllCategories);
router.get("/categories/:id", getCategoryById);

export default router;