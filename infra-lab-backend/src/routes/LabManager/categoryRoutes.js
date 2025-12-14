import express from "express";
import Category from "../../models/Category.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const data = await Category.find({}).lean();
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

export default router;
