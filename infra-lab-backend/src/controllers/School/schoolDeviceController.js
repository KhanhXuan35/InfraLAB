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
    const deviceIds = await Inventory.find({ location: "warehouse" }).distinct("device_id"); // lấy ra tất cả id có warehouse 


    const devices = await Device.find({ _id: { $in: deviceIds } }).populate("category_id").lean(); // tìm tất cả device có id trong mảng deviceIds

    const grouped = {};

    devices.forEach(device => {
      const key = device.category_id?._id?.toString();
      if (!key) return;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(device);
    });  // nhóm id trùng với device lại với nhau

    // devices = [
    //   { name: "A", category_id: { _id: 1 } },
    //   { name: "B", category_id: { _id: 2 } },
    //   { name: "C", category_id: { _id: 1 } }
    // ]

    // grouped = 
    // {
    //   "1": [
    //     { name: "A", category_id: { _id: 1 } },
    //     { name: "C", category_id: { _id: 1 } }
    //   ],
    //   "2": [
    //     { name: "B", category_id: { _id: 2 } }
    //   ]
    // }




    const categories = await DeviceCategory.find({ _id: { $in: Object.keys(grouped) } }).lean();

    // categories = [
    //   {
    //     "_id": "65bf7b329c8f2b1a3d4e6a21",
    //     "name": "Laptop & PC",
    //     "description": "Máy tính phục vụ thực hành code",
    //     "createdAt": "2024-01-01T00:00:00.000Z",
    //   },
    //   {
    //      "_id": "65bf7b329c8f2b1a3d4e6a01",
    //     "name": "Laptop & PC",
    //     "description": "Máy tính phục vụ thực hành code",
    //     "createdAt": "2024-01-01T00:00:00.000Z",
    //   }
    // ]
    
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


      //65bf7b329c8f2b1a3d4e6a01
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

// Cập nhật device + tồn kho cho location warehouse (hoặc location truyền vào)
export const updateDeviceWithInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      image,
      category_id,
      total,
      available,
      broken,
      location = "warehouse"
    } = req.body || {};

    const device = await Device.findById(id);
    if (!device) return res.status(404).json({ message: "Device not found" });

    if (category_id) {
      const cat = await DeviceCategory.findById(category_id);
      if (!cat) return res.status(400).json({ message: "Invalid category_id" });
      device.category_id = category_id;
    }
    if (name !== undefined) device.name = name;
    if (description !== undefined) device.description = description;
    if (image !== undefined) device.image = image;
    await device.save();

    const invUpdate = {};
    if (total !== undefined) invUpdate.total = Number(total) || 0;
    if (available !== undefined && available !== "") invUpdate.available = Math.max(Number(available) || 0, 0);
    if (broken !== undefined) invUpdate.broken = Math.max(Number(broken) || 0, 0);

    let inventory = await Inventory.findOne({ device_id: id, location });
    if (Object.keys(invUpdate).length > 0) {
      if (inventory) {
        Object.assign(inventory, invUpdate);
        await inventory.save();
      } else {
        inventory = await Inventory.create({
          device_id: id,
          location,
          total: invUpdate.total ?? 0,
          available: invUpdate.available ?? invUpdate.total ?? 0,
          broken: invUpdate.broken ?? 0
        });
      }
    }

    const updatedDevice = await Device.findById(id).populate("category_id");
    return res.json({ device: updatedDevice, inventory });
  } catch (error) {
    res.status(500).json({ message: "Failed to update device", error: error.message });
  }
};

export const deleteDeviceWithInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const device = await Device.findById(id);
    if (!device) return res.status(404).json({ message: "Device not found" });

    await Inventory.deleteMany({ device_id: id });
    await Device.deleteOne({ _id: id });

    res.json({ message: "Deleted device and related inventories" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete device", error: error.message });
  }
};
