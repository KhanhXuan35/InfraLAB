import express from "express";
import { getAllDevices, getDeviceById } from "../controllers/deviceController.js";
import { getAllCategories, getCategoryById } from "../controllers/categoryController.js";

const router = express.Router();

// Health check route
router.get("/", (req, res) => {
  res.json({ 
    message: "InfraLAB API is running",
    version: "1.0.0"
  });
});

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({ 
    status: "OK",
    timestamp: new Date().toISOString()
  });
});

// Device routes
router.get("/devices", getAllDevices);
router.get("/devices/:id", getDeviceById);

// Category routes
router.get("/categories", getAllCategories);
router.get("/categories/:id", getCategoryById);

export default router;

