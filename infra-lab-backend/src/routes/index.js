import express from "express";
import authRoute from "./common/authRoute.js";
import profileRoute from "./common/profileRoute.js";
import { getAllDevices, getDeviceById } from "../controllers/User/deviceController.js";
import { getAllCategories, getCategoryById, createCategory } from "../controllers/User/categoryController.js";
import { checkAuthMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.use("/auth", authRoute);
router.use("/profile", profileRoute);

// Device routes
router.get("/devices", getAllDevices);
router.get("/devices/:id", getDeviceById);

// Category routes
router.get("/categories", getAllCategories);
router.get("/categories/:id", getCategoryById);
router.post("/categories", checkAuthMiddleware, createCategory); // Chỉ user đã đăng nhập mới tạo được

export default router;