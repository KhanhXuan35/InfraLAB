import Inventory from "../../models/Inventory.js";
import Device from "../../models/Device.js";
import Category from "../../models/Category.js";
import DeviceInstance from "../../models/DeviceInstance.js";
import Repair from "../../models/Repair.js";

/**
 * Lấy danh sách thiết bị trong phòng Lab
 * GET /api/inventory/lab
 */
export const getLabDevices = async (req, res) => {
  try {
    // Bước 1: Lấy tất cả inventory có location = "lab"
    const inventories = await Inventory.find({ location: "lab" })
      .populate({
        path: "device_id",
        match: { verify: true },
        populate: { path: "category_id" }
      })
      .lean();

    // Bước 2: Lọc bỏ các inventory không có device_id hợp lệ
    const validInventories = [];
    for (let i = 0; i < inventories.length; i++) {
      const inventory = inventories[i];
      if (inventory.device_id && inventory.device_id._id) {
        validInventories.push(inventory);
      }
    }

    // Bước 3: Tính toán số liệu từ device instances thực tế ở lab
    const data = [];
    for (let i = 0; i < validInventories.length; i++) {
      const inventory = validInventories[i];
      const deviceId = inventory.device_id._id.toString();

      // Đếm device instances thực tế ở lab cho device này
      const instances = await DeviceInstance.find({
        device_model_id: deviceId,
        location: "lab"
      }).lean();

      // Đếm số lượng theo từng trạng thái
      let total = instances.length;
      let available = 0;
      let broken = 0;
      let borrowed = 0;

      for (let j = 0; j < instances.length; j++) {
        const instance = instances[j];
        if (instance.status === 'available') {
          available++;
        } else if (instance.status === 'broken') {
          broken++;
        } else if (instance.status === 'borrowed') {
          borrowed++;
        }
      }

      // Lấy thông tin device
      let deviceName = "N/A";
      if (inventory.device_id && inventory.device_id.name) {
        deviceName = inventory.device_id.name;
      }

      let deviceImage = "";
      if (inventory.device_id && inventory.device_id.image) {
        deviceImage = inventory.device_id.image;
      }

      let categoryName = "Không rõ";
      if (inventory.device_id && inventory.device_id.category_id && inventory.device_id.category_id.name) {
        categoryName = inventory.device_id.category_id.name;
      }

      let deviceIdValue = null;
      if (inventory.device_id && inventory.device_id._id) {
        deviceIdValue = inventory.device_id._id;
      }

      // Tạo object kết quả
      const resultItem = {
        _id: inventory._id,
        total: total,
        available: available,
        broken: broken,
        borrowed: borrowed,
        device: {
          _id: deviceIdValue,
          name: deviceName,
          image: deviceImage,
          category: categoryName
        }
      };

      data.push(resultItem);
    }

    // Bước 4: Trả về kết quả
    res.json({ data });

  } catch (err) {
    console.error("getLabDevices error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Lọc thiết bị theo nhiều điều kiện
 * GET /api/inventory/filter
 */
export const filterInventory = async (req, res) => {
  try {
    // Bước 1: Lấy các tham số từ query
    const search = req.query.search;
    const category = req.query.category || "all";
    const status = req.query.status || "all";
    const area = req.query.area || "lab";
    const minTotal = req.query.minTotal;
    const maxTotal = req.query.maxTotal;

    // Bước 2: Tạo filter cho MongoDB
    const mongoFilter = {};
    
    if (area && area !== "all") {
      mongoFilter.location = area;
    } else {
      mongoFilter.location = "lab"; // Mặc định lọc trong Lab
    }

    if (minTotal || maxTotal) {
      mongoFilter.total = {};
      if (minTotal) {
        mongoFilter.total.$gte = Number(minTotal);
      }
      if (maxTotal) {
        mongoFilter.total.$lte = Number(maxTotal);
      }
    }

    // Bước 3: Tìm inventory theo filter
    const inventories = await Inventory.find(mongoFilter)
      .populate({
        path: "device_id",
        match: { verify: true },
        model: Device,
        populate: { path: "category_id" }
      })
      .lean();

    // Bước 4: Lọc bỏ các inventory không có device_id hợp lệ
    const validInventories = [];
    for (let i = 0; i < inventories.length; i++) {
      const inventory = inventories[i];
      if (inventory.device_id && inventory.device_id._id) {
        validInventories.push(inventory);
      }
    }

    // Bước 5: Chuyển đổi sang format chuẩn
    let data = [];
    for (let i = 0; i < validInventories.length; i++) {
      const inventory = validInventories[i];
      
      const totalValue = inventory.total || 0;
      const availableValue = inventory.available || 0;
      const brokenValue = inventory.broken || 0;
      const borrowed = totalValue - availableValue - brokenValue;
      const borrowedValue = borrowed > 0 ? borrowed : 0;

      let deviceIdValue = null;
      if (inventory.device_id && inventory.device_id._id) {
        deviceIdValue = inventory.device_id._id;
      }

      let deviceName = "";
      if (inventory.device_id && inventory.device_id.name) {
        deviceName = inventory.device_id.name;
      }

      let categoryName = "";
      if (inventory.device_id && inventory.device_id.category_id && inventory.device_id.category_id.name) {
        categoryName = inventory.device_id.category_id.name;
      } else if (inventory.device_id && inventory.device_id.category) {
        categoryName = inventory.device_id.category;
      }

      const resultItem = {
        _id: inventory._id,
        device: {
          _id: deviceIdValue,
          name: deviceName,
          category: categoryName
        },
        total: totalValue,
        available: availableValue,
        broken: brokenValue,
        borrowed: borrowedValue
      };

      data.push(resultItem);
    }

    // Bước 6: Lọc thêm theo search
    if (search) {
      const searchLower = search.toLowerCase();
      const filteredData = [];
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const deviceNameLower = item.device.name.toLowerCase();
        if (deviceNameLower.includes(searchLower)) {
          filteredData.push(item);
        }
      }
      data = filteredData;
    }

    // Bước 7: Lọc theo category
    if (category && category !== "all") {
      const filteredData = [];
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (item.device.category === category) {
          filteredData.push(item);
        }
      }
      data = filteredData;
    }

    // Bước 8: Lọc theo status
    if (status && status !== "all") {
      const filteredData = [];
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (status === "available" && item.available > 0) {
          filteredData.push(item);
        } else if (status === "borrowed" && item.borrowed > 0) {
          filteredData.push(item);
        } else if (status === "broken" && item.broken > 0) {
          filteredData.push(item);
        }
      }
      data = filteredData;
    }

    // Bước 9: Trả về kết quả
    res.json({ success: true, data });

  } catch (err) {
    console.error("filterInventory error", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * Lấy chi tiết thiết bị theo inventory ID
 * GET /api/device-detail/:id
 * @param {string} id - inventoryId
 */
export const getDeviceDetail = async (req, res) => {
  try {
    // Bước 1: Lấy inventory ID từ params
    const inventoryId = req.params.id;

    // Bước 2: Tìm inventory theo ID
    const inventory = await Inventory.findById(inventoryId)
      .populate({
        path: "device_id",
        populate: { path: "category_id" }
      });

    // Bước 3: Kiểm tra inventory có tồn tại không
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy Inventory."
      });
    }

    // Bước 4: Lấy thông tin device
    const device = inventory.device_id;

    // Bước 5: Kiểm tra thiết bị có đơn sửa chữa nào chưa hoàn thành không
    const pendingRepair = await Repair.findOne({
      device_id: device._id,
      status: { $in: ["pending", "approved", "in_progress"] }
    });

    // Bước 6: Tạo object kết quả
    const result = {
      success: true,
      data: {
        inventory: {
          _id: inventory._id,
          total: inventory.total,
          available: inventory.available,
          broken: inventory.broken,
          location: inventory.location
        },
        device: {
          _id: device._id,
          name: device.name,
          image: device.image,
          description: device.description,
          category_id: device.category_id
        },
        pendingRepair: pendingRepair || null
      }
    };

    // Bước 7: Trả về kết quả
    return res.json(result);

  } catch (err) {
    console.error("Detail device error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
