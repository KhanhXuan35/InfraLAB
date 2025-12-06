import Inventory from "../../models/Inventory.js";
import DeviceCategory from "../../models/Category.js";
import Device from "../../models/Device.js";

export const getInventories = async (req, res) => {
  try {
    const inventories = await Inventory.find({ location: "warehouse" });
    res.json(inventories);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch inventories", error: error.message });
  }
};

export const getDeviceCategories = async (req, res) => {
  try {
    // Lấy inventories kho warehouse → deviceIds → devices + category_id
    const deviceIds = (await Inventory.find({ location: "warehouse" })).map((inv) => inv.device_id);
    const devices = await Device.find({ _id: { $in: deviceIds } }).populate("category_id");

    // Nhóm nhanh theo category_id
    const grouped = devices.reduce((acc, d) => {
      const key = d.category_id?._id?.toString();
      if (!key) return acc;
      (acc[key] = acc[key] || []).push(d);
      return acc;
    }, {});

    // Chỉ trả category có thiết bị, kèm danh sách thiết bị
    const categories = await DeviceCategory.find({ _id: { $in: Object.keys(grouped) } });
    res.json(
      categories.map((cat) => ({
        ...cat.toObject(),
        devices: grouped[cat._id.toString()] || []
      }))
    );
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch device categories", error: error.message });
  }
};

export const getDevices = async (req, res) => {
  try {
    const inventories = await Inventory.find({ location: "warehouse" });
    const deviceIds = inventories.map((inv) => inv.device_id);
    const devices = await Device.find({ _id: { $in: deviceIds } }).populate("category_id");
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch devices", error: error.message });
  }
};
