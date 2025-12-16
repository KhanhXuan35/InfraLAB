import Inventory from "../../../models/Inventory.js";
import DeviceCategory from "../../../models/Category.js";
import Device from "../../../models/Device.js";
import User from "../../../models/User.js";

/**
 * Lab Manager tạo yêu cầu thiết bị mới
 * POST /api/devices
 */
export const createNewDeviceRequest = async (req, res) => {
  try {
    const { name, description = "", image = "", category_id, total = 0, location = "warehouse", userId } =
      req.body || {};

    if (!name || !category_id) {
      return res.status(400).json({ message: "name and category_id are required" });
    }

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    if (!["warehouse", "lab"].includes(location)) {
      return res.status(400).json({ message: "location must be 'warehouse' or 'lab'" });
    }

    const category = await DeviceCategory.findById(category_id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Kiểm tra role của user để set verify
    // Lab Manager tạo sẽ có verify: false (chờ School Admin duyệt)
    const verify = user.role === "school_admin";

    const device = await Device.create({ 
      name, 
      description, 
      image, 
      category_id, 
      verify,
      createdBy: userId 
    });

    const parsedTotal = Number(total) || 0;

    // Tạo inventory với location warehouse (sẽ chuyển sang lab khi duyệt)
    const inventory = await Inventory.create({
      device_id: device._id,
      location,
      total: parsedTotal,
      available: parsedTotal,
      broken: 0
    });

    res.status(201).json({ success: true, data: { device, inventory } });
  } catch (error) {
    console.error("createNewDeviceRequest error:", error);
    res.status(500).json({ success: false, message: "Failed to create device", error: error.message });
  }
};

