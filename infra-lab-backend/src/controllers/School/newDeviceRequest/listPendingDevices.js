import Inventory from "../../../models/Inventory.js";
import Device from "../../../models/Device.js";

/**
 * School Admin xem danh sách thiết bị chờ duyệt
 * GET /api/devices/pending
 */
export const listPendingDevices = async (req, res) => {
  try {
    const devices = await Device.find({ verify: false })
      .populate('category_id', 'name description')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    // Lấy thông tin inventory cho mỗi device
    const devicesWithInventory = await Promise.all(
      devices.map(async (device) => {
        const inventory = await Inventory.findOne({ device_id: device._id });
        return {
          _id: device._id,
          name: device.name,
          description: device.description,
          image: device.image,
          category: device.category_id,
          createdBy: device.createdBy,
          inventory: inventory ? {
            total: inventory.total,
            location: inventory.location
          } : null,
          createdAt: device.createdAt
        };
      })
    );

    res.json({ success: true, data: devicesWithInventory });
  } catch (error) {
    console.error('listPendingDevices error:', error);
    res.status(500).json({ success: false, message: "Failed to fetch pending devices", error: error.message });
  }
};

