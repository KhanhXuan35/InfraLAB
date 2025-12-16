import Inventory from "../../../models/Inventory.js";
import Device from "../../../models/Device.js";

/**
 * School Admin từ chối thiết bị mới
 * PATCH /api/devices/:id/reject
 * 
 * Logic: Xóa device và inventory
 */
export const rejectNewDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const device = await Device.findById(id);
    
    if (!device) {
      return res.status(404).json({ success: false, message: "Device not found" });
    }

    // Xóa inventory
    await Inventory.deleteMany({ device_id: id });
    
    // Xóa device
    await Device.deleteOne({ _id: id });

    res.json({ success: true, message: "Device rejected and deleted" });
  } catch (error) {
    console.error('rejectNewDevice error:', error);
    res.status(500).json({ success: false, message: "Failed to reject device", error: error.message });
  }
};

