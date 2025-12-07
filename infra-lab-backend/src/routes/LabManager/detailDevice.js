// src/routes/LabManager/detailDevice.js
import express from "express";
import Device from "../../models/Device.js";
import Inventory from "../../models/Inventory.js";

const router = express.Router();

/**
 * GET /api/device-detail/:inventoryId
 * inventoryId = _id của Inventory
 * Trả về: { device, inventory }
 */
router.get("/:inventoryId", async (req, res) => {
  try {
    const { inventoryId } = req.params;

    // 1. Tìm Inventory theo _id
    const inventory = await Inventory.findById(inventoryId)
      .populate({
        path: "device_id",
        populate: { path: "category_id" }, // nếu muốn lấy luôn Category
      });

    if (!inventory) {
      return res
        .status(404)
        .json({ success: false, message: "Inventory not found" });
    }

    // 2. Lấy Device từ inventory.device_id
    const device = inventory.device_id;

    if (!device) {
      return res
        .status(404)
        .json({ success: false, message: "Device not found in inventory" });
    }

    // 3. Chuẩn hóa data trả về frontend
    res.json({
      success: true,
      data: {
        device: {
          _id: device._id,
          name: device.name,
          description: device.description,
          image: device.image,
          category_id: device.category_id, // đã populate
        },
        inventory: {
          _id: inventory._id,
          location: inventory.location,
          total: inventory.total ?? 0,
          available: inventory.available ?? 0,
          broken: inventory.broken ?? 0,
        },
      },
    });
  } catch (error) {
    console.error("Detail device error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

export default router;
