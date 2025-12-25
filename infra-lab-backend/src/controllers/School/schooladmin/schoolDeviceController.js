import Inventory from "../../../models/Inventory.js";
import DeviceCategory from "../../../models/Category.js";
import Device from "../../../models/Device.js";
import User from "../../../models/User.js";

// Lấy danh sách inventory từ kho warehouse
export const getInventories = async (req, res) => {
  try {
    const inventories = await Inventory.find({ location: "warehouse" });
    res.json({ success: true, data: inventories });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch inventories", 
      error: error.message 
    });
  }
};

// Lấy danh sách categories kèm devices đã nhóm theo category
// Dùng cho dropdown phân cấp hoặc hiển thị theo nhóm
export const getDeviceCategories = async (req, res) => {
  try {
  // Lấy danh sách device_id có trong kho warehouse
    const deviceIds = await Inventory.find({ location: "warehouse" })
      .distinct("device_id");

    // Lấy thông tin đầy đủ của các devices và populate category
    const devices = await Device.find({ _id: { $in: deviceIds } })
      .populate("category_id")
      .lean();

    //  Nhóm devices theo category_id
    const grouped = {};
    for (let i = 0; i < devices.length; i++) {
      const device = devices[i];
      const categoryId = device.category_id?._id;
      
      if (!categoryId) {
        continue; // Bỏ qua device không có category
      }
      
      const categoryIdStr = categoryId.toString();
      
      if (!grouped[categoryIdStr]) {
        grouped[categoryIdStr] = [];
      }
      
      grouped[categoryIdStr].push(device);
    }

    //  Lấy thông tin các categories
    const categoryIds = Object.keys(grouped);
    const categories = await DeviceCategory.find({ 
      _id: { $in: categoryIds } 
    }).lean();

    //  Gắn devices vào từng category
    const result = categories.map((category) => {
      const categoryIdStr = category._id.toString();
      return {
        ...category,
        devices: grouped[categoryIdStr] || []
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch device categories", 
      error: error.message 
    });
  }
};

// Lấy danh sách devices từ kho (warehouse
// Mỗi device kèm thông tin inventory
export const getDevices = async (req, res) => {
  try {
    // Lấy location từ query, mặc định là warehouse
    const location = req.query.location || "warehouse";

    // Bước 1: Lấy danh sách device_id có trong kho
    const deviceIds = await Inventory.find({ location })
      .distinct("device_id");

    if (!deviceIds || deviceIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Bước 2: Lấy thông tin devices và populate category
    const devices = await Device.find({ _id: { $in: deviceIds } })
      .populate({
        path: "category_id",
        select: "_id name description",
        model: "Category"
      });

    // Bước 3: Chuyển sang plain object và lọc devices có category
    const validDevices = [];
    for (let i = 0; i < devices.length; i++) {
      const device = devices[i];
      const deviceObj = device.toObject();
      
      if (deviceObj.category_id) {
        validDevices.push(deviceObj);
      }
    }

    // Bước 4: Lấy inventory cho mỗi device
    const devicesWithInventory = [];
    for (let i = 0; i < validDevices.length; i++) {
      const device = validDevices[i];
      const inventory = await Inventory.findOne({
        device_id: device._id,
        location: location
      }).lean();

      devicesWithInventory.push({
        ...device,
        inventory: inventory || null
      });
    }

    res.json({ success: true, data: devicesWithInventory });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch devices", 
      error: error.message 
    });
  }
};

// Tạo device mới kèm inventory
// tạo yêu cầu thiết bị ngoài
export const createDeviceWithInventory = async (req, res) => {
  try {
    const { 
      name, 
      description = "", 
      image = "", 
      category_id, 
      total = 0, 
      location = "warehouse", 
      userId 
    } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!name || !category_id) {
      return res.status(400).json({ 
        message: "name and category_id are required" 
      });
    }

    if (!userId) {
      return res.status(400).json({ 
        message: "userId is required" 
      });
    }

    if (location !== "warehouse" && location !== "lab") {
      return res.status(400).json({ 
        message: "location must be 'warehouse' or 'lab'" 
      });
    }

    // Kiểm tra category có tồn tại không
    const category = await DeviceCategory.findById(category_id);
    if (!category) {
      return res.status(404).json({ 
        message: "Category not found" 
      });
    }

    // Kiểm tra user có tồn tại không
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        message: "User not found" 
      });
    }

    // Xác định verify dựa trên role
    const verify = user.role === "school_admin";

    // Tạo device mới
    const device = await Device.create({
      name,
      description,
      image,
      category_id,
      verify: verify,
      createdBy: userId
    });

    const parsedTotal = Number(total) || 0;

    // Nếu là Lab Manager tạo yêu cầu thiết bị ngoài
    if (user.role === "lab_manager" && !verify) {
      // Tạo RequestLab để lưu yêu cầu
      const RequestLab = (await import("../../../models/requestlab.js")).default;
      const request = await RequestLab.create({
        device_id: device._id,
        qty: parsedTotal,
        created_by: userId,
        status: "WAITING"
      });

      // Gửi thông báo cho tất cả School Admin
      try {
        const Notifications = (await import("../../../models/Notifications.js")).default;
        const schoolAdmins = await User.find({ role: "school_admin" })
          .select("_id");

        for (let i = 0; i < schoolAdmins.length; i++) {
          const admin = schoolAdmins[i];
          await Notifications.create({
            user_id: admin._id,
            type: "new_device_request",
            message: `Có yêu cầu thiết bị mới "${device.name}" (${parsedTotal} cái) từ Lab Manager ${user.name || user.email}. Vui lòng xem và duyệt yêu cầu.`,
            related_id: request._id,
            related_type: "RequestLab",
            read: false
          });
        }
      } catch (notifError) {
        console.error("Error creating notifications:", notifError);
      }

      // Không tạo inventory, chỉ trả về device
      return res.status(201).json({ 
        success: true, 
        data: { device, inventory: null } 
      });
    } else {
      // Nếu là School Admin → tạo inventory như bình thường
      const inventory = await Inventory.create({
        device_id: device._id,
        location: location,
        total: parsedTotal,
        available: parsedTotal,
        broken: 0
      });

      return res.status(201).json({ 
        success: true, 
        data: { device, inventory } 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to create device", 
      error: error.message 
    });
  }
};

// Cập nhật device và inventory
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
    } = req.body;

    // Tìm device
    const device = await Device.findById(id);
    if (!device) {
      return res.status(404).json({ 
        message: "Device not found" 
      });
    }

    // Cập nhật thông tin device
    if (category_id) {
      const category = await DeviceCategory.findById(category_id);
      if (!category) {
        return res.status(400).json({ 
          message: "Invalid category_id" 
        });
      }
      device.category_id = category_id;
    }

    if (name !== undefined) {
      device.name = name;
    }
    if (description !== undefined) {
      device.description = description;
    }
    if (image !== undefined) {
      device.image = image;
    }
    await device.save();

    // Cập nhật inventory
    const invUpdate = {};
    if (total !== undefined) {
      invUpdate.total = Number(total) || 0;
    }
    if (available !== undefined && available !== "") {
      invUpdate.available = Math.max(Number(available) || 0, 0);
    }
    if (broken !== undefined) {
      invUpdate.broken = Math.max(Number(broken) || 0, 0);
    }

    let inventory = await Inventory.findOne({ 
      device_id: id, 
      location: location 
    });

    if (Object.keys(invUpdate).length > 0) {
      if (inventory) {
        // Cập nhật inventory có sẵn
        inventory.total = invUpdate.total !== undefined ? invUpdate.total : inventory.total;
        inventory.available = invUpdate.available !== undefined ? invUpdate.available : inventory.available;
        inventory.broken = invUpdate.broken !== undefined ? invUpdate.broken : inventory.broken;
        await inventory.save();
      } else {
        // Tạo inventory mới nếu chưa có
        inventory = await Inventory.create({
          device_id: id,
          location: location,
          total: invUpdate.total || 0,
          available: invUpdate.available || invUpdate.total || 0,
          broken: invUpdate.broken || 0
        });
      }
    }

    // Lấy lại device với category đã populate
    const updatedDevice = await Device.findById(id)
      .populate("category_id");

    return res.json({ 
      success: true, 
      data: { device: updatedDevice, inventory } 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to update device", 
      error: error.message 
    });
  }
};

// Xóa device và tất cả inventory liên quan
export const deleteDeviceWithInventory = async (req, res) => {
  try {
    const { id } = req.params;

    const device = await Device.findById(id);
    if (!device) {
      return res.status(404).json({ 
        success: false, 
        message: "Device not found" 
      });
    }

    // Xóa tất cả inventory của device
    await Inventory.deleteMany({ device_id: id });
    
    // Xóa device
    await Device.deleteOne({ _id: id });

    res.json({ 
      success: true, 
      message: "Deleted device and related inventories" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete device", 
      error: error.message 
    });
  }
};

// Lấy danh sách devices chưa được duyệt (verify = false)
export const getPendingDevices = async (req, res) => {
  try {
    const devices = await Device.find({ verify: false })
      .populate('category_id', 'name description')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Lấy inventory cho mỗi device
    const devicesWithInventory = [];
    for (let i = 0; i < devices.length; i++) {
      const device = devices[i];
      const inventory = await Inventory.findOne({ 
        device_id: device._id 
      });

      devicesWithInventory.push({
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
      });
    }

    res.json({ 
      success: true, 
      data: devicesWithInventory 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch pending devices", 
      error: error.message 
    });
  }
};

// Duyệt device (set verify = true)
export const approveDevice = async (req, res) => {
  try {
    const { id } = req.params;

    const device = await Device.findById(id);
    if (!device) {
      return res.status(404).json({ 
        success: false, 
        message: "Device not found" 
      });
    }

    if (device.verify) {
      return res.status(400).json({ 
        success: false, 
        message: "Device already verified" 
      });
    }

    // Cập nhật verify = true
    device.verify = true;
    await device.save();

    // Tìm RequestLab tương ứng
    const RequestLab = (await import("../../../models/requestlab.js")).default;
    const request = await RequestLab.findOne({
      device_id: device._id,
      status: "WAITING"
    });

    // Gửi thông báo cho Lab Manager
    if (request) {
      const qty = request.qty || 0;
      try {
        const Notifications = (await import("../../../models/Notifications.js")).default;
        await Notifications.create({
          user_id: request.created_by,
          type: "new_device_approved",
          message: `Thiết bị mới "${device.name}" (${qty} cái) đã được duyệt. Bạn có thể mượn thiết bị từ kho School.`,
          related_id: device._id,
          related_type: "Device",
          read: false
        });
      } catch (notifError) {
        console.error("Error creating notification:", notifError);
      }
    }

    res.json({ 
      success: true, 
      message: "Device approved. Notification sent to Lab Manager.", 
      data: device 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to approve device", 
      error: error.message 
    });
  }
};

// Từ chối device (xóa device và inventory)
export const rejectDevice = async (req, res) => {
  try {
    const { id } = req.params;

    const device = await Device.findById(id);
    if (!device) {
      return res.status(404).json({ 
        success: false, 
        message: "Device not found" 
      });
    }

    // Xóa inventory
    await Inventory.deleteMany({ device_id: id });
    
    // Xóa device
    await Device.deleteOne({ _id: id });

    res.json({ 
      success: true, 
      message: "Device rejected and deleted" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to reject device", 
      error: error.message 
    });
  }
};
