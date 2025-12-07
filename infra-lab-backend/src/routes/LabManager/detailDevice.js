import express from "express";
import Device from "../../models/Device.js";
import Inventory from "../../models/Inventory.js";
import Repair from "../../models/Repair.js";

const router = express.Router();

/**
 * GET /api/device-detail/:id
 * id = inventoryId
 */
router.get("/:id", async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id)
      .populate({
        path: "device_id",
        populate: { path: "category_id" },
      });

    if (!inventory)
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy Inventory.",
      });

    const device = inventory.device_id;

    // Kiểm tra thiết bị có đơn sửa chữa nào chưa hoàn thành không
    const pendingRepair = await Repair.findOne({
      device_id: device._id,
      status: { $in: ["pending", "approved", "in_progress"] },
    });

    return res.json({
      success: true,
      data: {
        inventory: {
          _id: inventory._id,
          total: inventory.total,
          available: inventory.available,
          broken: inventory.broken,
          location: inventory.location,
        },
        device: {
          _id: device._id,
          name: device.name,
          image: device.image,
          description: device.description,
          category_id: device.category_id,
        },
        pendingRepair: pendingRepair || null,
      },
    });
  } catch (err) {
    console.error("Detail device error:", err);
    res.status(500).json({ success: false });
  }
});

export default router;
