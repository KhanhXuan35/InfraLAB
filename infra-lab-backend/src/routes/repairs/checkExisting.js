import express from "express";
import Repair from "../../models/Repair.js";

const router = express.Router();

router.get("/check", async (req, res) => {
  try {
    const { device_id } = req.query;

    const repair = await Repair.findOne({
      device_id,
      status: { $in: ["pending", "approved", "in_progress"] }
    });

    if (!repair) return res.json({ exists: false });

    return res.json({
      exists: true,
      status: repair.status
    });
  } catch (err) {
    console.error(err);
    res.json({ exists: false });
  }
});

export default router;
