import Inventory from "../../../models/Inventory.js";
import Device from "../../../models/Device.js";

/**
 * School Admin duyệt thiết bị mới
 * PATCH /api/devices/:id/approve
 * 
 * Logic:
 * 1. Set verify = true (thiết bị được duyệt)
 * 2. Giữ nguyên inventory ở warehouse (thiết bị vào kho school)
 * 3. Lab Manager muốn dùng phải mượn riêng (qua luồng mượn thiết bị)
 */
export const approveNewDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const device = await Device.findById(id);
    
    if (!device) {
      return res.status(404).json({ success: false, message: "Device not found" });
    }
    
    if (device.verify) {
      return res.status(400).json({ success: false, message: "Device already verified" });
    }

    // Set verify = true (thiết bị được duyệt, có thể sử dụng)
    device.verify = true;
    await device.save();

    // Thiết bị vẫn ở warehouse (kho school)
    // Lab Manager muốn dùng phải mượn qua luồng mượn thiết bị riêng

    res.json({ success: true, message: "Device approved and available in warehouse", data: device });
  } catch (error) {
    console.error('approveNewDevice error:', error);
    res.status(500).json({ success: false, message: "Failed to approve device", error: error.message });
  }
};

