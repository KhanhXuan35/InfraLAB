import express from "express";
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

export default router;

