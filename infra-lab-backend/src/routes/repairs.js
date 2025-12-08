import express from "express";
import Repair from "../models/Repair.js";

const router = express.Router();

/* ---------------------------------------
   CREATE REPAIR REQUEST (Teacher)
--------------------------------------- */
router.post("/", async (req, res) => {
  try {
    const { device_id, reason, quantity } = req.body;

    if (!device_id || !reason) {
      return res.status(400).json({
        success: false,
        message: "Thiếu dữ liệu yêu cầu."
      });
    }

    // Check trùng đơn: pending, approved, in_progress
    const existing = await Repair.findOne({
      device_id,
      status: { $in: ["pending", "approved", "in_progress"] }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Thiết bị này đã có yêu cầu sửa chữa đang được xử lý.",
        data: existing
      });
    }

    const repair = await Repair.create({
      device_id,
      reason,
      quantity,
      status: "pending"
    });

    res.json({
      success: true,
      message: "Tạo yêu cầu sửa chữa thành công.",
      data: repair
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi server." });
  }
});


/* ---------------------------------------
   GET LIST OF REPAIR REQUESTS (School)
   /repairs?status=pending
--------------------------------------- */
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;

    let filter = {};
    if (status && status !== "all") {
      filter.status = status;
    }

    const repairs = await Repair.find(filter)
      .populate("device_id")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: repairs });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi server." });
  }
});


/* ---------------------------------------
   UPDATE STATUS (School Approve, Reject,…)
--------------------------------------- */
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const repair = await Repair.findById(req.params.id);
    if (!repair)
      return res.status(404).json({ success: false, message: "Không tìm thấy yêu cầu." });

    repair.status = status;

    if (status === "done") {
      repair.completed_at = new Date();
    }

    await repair.save();

    res.json({
      success: true,
      message: "Cập nhật trạng thái thành công.",
      data: repair
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi server." });
  }
});

export default router;
