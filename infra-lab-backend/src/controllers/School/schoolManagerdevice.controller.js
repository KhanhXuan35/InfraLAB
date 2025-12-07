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
    const deviceIds = await Inventory.find({ location: "warehouse" }).distinct("device_id");
    const devices = await Device.find({ _id: { $in: deviceIds } }).populate("category_id").lean();

    const grouped = devices.reduce((acc, device) => {
      const key = device.category_id?._id?.toString();
      if (!key) return acc;
      (acc[key] = acc[key] || []).push(device);
      return acc;
    }, {});

    const categories = await DeviceCategory.find({ _id: { $in: Object.keys(grouped) } }).lean();
    res.json(
      categories.map((cat) => ({
        ...cat,
        devices: grouped[cat._id.toString()] || []
      }))
    );
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch device categories", error: error.message });
  }
};

export const getDevices = async (req, res) => {
  try {
    const location = req.query.location || "warehouse";
    const deviceIds = await Inventory.find({ location }).distinct("device_id");
    const devices = await Device.find({ _id: { $in: deviceIds } }).populate("category_id");
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch devices", error: error.message });
  }
};

export const createDeviceWithInventory = async (req, res) => {
  try {
    const { name, description = "", image = "", category_id, total = 0, available, broken = 0, location = "warehouse" } =
      req.body || {};

    if (!name || !category_id) {
      return res.status(400).json({ message: "name and category_id are required" });
    }

    if (!["warehouse", "lab"].includes(location)) {
      return res.status(400).json({ message: "location must be 'warehouse' or 'lab'" });
    }

    const category = await DeviceCategory.findById(category_id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const device = await Device.create({ name, description, image, category_id });

    const parsedTotal = Number(total) || 0;
    const parsedBroken = Number(broken) || 0;
    const parsedAvailable =
      available !== undefined && available !== null ? Number(available) : Math.max(parsedTotal - parsedBroken, 0);

    const inventory = await Inventory.create({
      device_id: device._id,
      location,
      total: parsedTotal,
      available: parsedAvailable,
      broken: parsedBroken
    });

    res.status(201).json({ device, inventory });
  } catch (error) {
    res.status(500).json({ message: "Failed to create device", error: error.message });
  }
};
