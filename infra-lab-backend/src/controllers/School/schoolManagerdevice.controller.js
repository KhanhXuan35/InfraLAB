import Inventory from "../../models/inventories.model.js";
import DeviceCategory from "../../models/device_categories.model.js";
import Device from "../../models/devices.model.js";

export const getInventories = async (req, res) => {
  try {
    const inventories = await Inventory.find();
    res.json(inventories);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch inventories", error: error.message });
  }
};

export const getDeviceCategories = async (req, res) => {
  try {
    const categories = await DeviceCategory.find().populate("inventoryId");
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch device categories", error: error.message });
  }
};

export const getDevices = async (req, res) => {
  try {
    const devices = await Device.find().populate({
      path: "categoryId",
      populate: { path: "inventoryId" }
    });
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch devices", error: error.message });
  }
};
