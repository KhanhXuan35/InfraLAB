import Device from "../../models/Device.js";
import Category from "../../models/Category.js";
import Inventory from "../../models/Inventory.js";
import DeviceInstance from "../../models/DeviceInstance.js";

// Get all devices with category and inventory info
export const getAllDevices = async (req, res) => {
  try {
    const { category, location } = req.query;
    console.log('GET /api/devices - Query params:', { category, location });
    
    let query = {};
    if (category) {
      const categoryDoc = await Category.findOne({ name: category });
      if (categoryDoc) {
        query.category_id = categoryDoc._id;
        console.log('Found category:', categoryDoc.name);
      } else {
        console.log('Category not found:', category);
      }
    }

    const devices = await Device.find({ ...query, verify: true })
      .populate('category_id', 'name description')
      .sort({ createdAt: -1 });

    console.log(`Found ${devices.length} devices`);

    // Get inventory info for each device and filter only devices with inventory at specified location
    const targetLocation = location || 'lab';
    const devicesWithInventory = await Promise.all(
      devices.map(async (device) => {
        // Tính toán số lượng thực tế từ DeviceInstance
        const actualTotal = await DeviceInstance.countDocuments({
          device_model_id: device._id,
          location: targetLocation,
        });

        const actualAvailable = await DeviceInstance.countDocuments({
          device_model_id: device._id,
          location: targetLocation,
          status: "available",
        });

        const actualBroken = await DeviceInstance.countDocuments({
          device_model_id: device._id,
          location: targetLocation,
          status: "broken",
        });

        // Lấy inventory từ bảng Inventory (để so sánh)
        const inventory = await Inventory.findOne({
          device_id: device._id,
          location: targetLocation
        });

        // Chỉ trả về device nếu có thiết bị tại location được yêu cầu
        if (actualTotal === 0 && (!inventory || inventory.total === 0)) {
          return null;
        }

        return {
          _id: device._id,
          name: device.name,
          description: device.description,
          image: device.image,
          category: device.category_id,
          inventory: {
            total: actualTotal || inventory?.total || 0,
            available: actualAvailable || inventory?.available || 0,
            broken: actualBroken || inventory?.broken || 0,
            location: targetLocation
          },
          createdAt: device.createdAt,
          updatedAt: device.updatedAt
        };
      })
    );

    // Filter out null values (devices without inventory at the location)
    const filteredDevices = devicesWithInventory.filter(device => device !== null);

    console.log(`Found ${devices.length} total devices, ${filteredDevices.length} devices with inventory at location: ${targetLocation}`);

    res.status(200).json({
      success: true,
      data: filteredDevices,
      count: filteredDevices.length
    });
  } catch (error) {
    console.error('Error in getAllDevices:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get device by ID
export const getDeviceById = async (req, res) => {
  try {
    const { id } = req.params;
    const { location } = req.query;
    const targetLocation = location || 'lab';

    const device = await Device.findById(id)
      .populate('category_id', 'name description');

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Lấy inventory từ bảng Inventory (có thể không đồng bộ)
    const inventory = await Inventory.findOne({
      device_id: device._id,
      location: targetLocation
    });

    // Tính toán số lượng thực tế từ DeviceInstance
    const actualTotal = await DeviceInstance.countDocuments({
      device_model_id: device._id,
      location: targetLocation,
    });

    const actualAvailable = await DeviceInstance.countDocuments({
      device_model_id: device._id,
      location: targetLocation,
      status: "available",
    });

    const actualBorrowed = await DeviceInstance.countDocuments({
      device_model_id: device._id,
      location: targetLocation,
      status: "borrowed",
    });

    const actualBroken = await DeviceInstance.countDocuments({
      device_model_id: device._id,
      location: targetLocation,
      status: "broken",
    });

    const actualRepairing = await DeviceInstance.countDocuments({
      device_model_id: device._id,
      location: targetLocation,
      status: "repairing",
    });

    // Debug log để kiểm tra
    console.log(`[getDeviceById] Device: ${device.name} (${device._id})`);
    console.log(`  - Location: ${targetLocation}`);
    console.log(`  - Actual from DeviceInstance: total=${actualTotal}, available=${actualAvailable}, borrowed=${actualBorrowed}, broken=${actualBroken}, repairing=${actualRepairing}`);
    console.log(`  - Inventory reported: total=${inventory?.total || 0}, available=${inventory?.available || 0}, broken=${inventory?.broken || 0}`);

    // LUÔN sử dụng số lượng thực tế từ DeviceInstance (không fallback về Inventory)
    // Vì DeviceInstance là nguồn dữ liệu chính xác nhất
    const inventoryData = {
      total: actualTotal, // Luôn dùng từ DeviceInstance
      available: actualAvailable, // Luôn dùng từ DeviceInstance
      broken: actualBroken, // Luôn dùng từ DeviceInstance
      borrowed: actualBorrowed, // Luôn dùng từ DeviceInstance
      repairing: actualRepairing, // Luôn dùng từ DeviceInstance
      location: targetLocation,
      // Thêm thông tin để biết có đồng bộ không (để debug)
      inventory_synced: inventory ? 
        (inventory.available === actualAvailable && inventory.total === actualTotal) : 
        false,
      inventory_reported: inventory ? {
        total: inventory.total,
        available: inventory.available,
        broken: inventory.broken,
        borrowed: inventory.borrowed || 0,
      } : null,
    };

    // Chỉ trả về device nếu có thiết bị tại location được yêu cầu
    if (actualTotal === 0 && (!inventory || inventory.total === 0)) {
      return res.status(404).json({
        success: false,
        message: `Thiết bị không có tại ${targetLocation === 'lab' ? 'phòng Lab' : 'kho'}`
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: device._id,
        name: device.name,
        description: device.description,
        image: device.image,
        category: device.category_id,
        inventory: inventoryData,
        createdAt: device.createdAt,
        updatedAt: device.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

