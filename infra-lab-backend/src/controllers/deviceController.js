import Device from "../models/Device.js";
import Category from "../models/Category.js";
import Inventory from "../models/Inventory.js";

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

    const devices = await Device.find(query)
      .populate('category_id', 'name description')
      .sort({ createdAt: -1 });

    console.log(`Found ${devices.length} devices`);

    // Get inventory info for each device and filter only devices with inventory at specified location
    const targetLocation = location || 'lab';
    const devicesWithInventory = await Promise.all(
      devices.map(async (device) => {
        const inventory = await Inventory.findOne({
          device_id: device._id,
          location: targetLocation
        });

        // Only return device if it has inventory at the specified location
        if (!inventory) {
          return null;
        }

        return {
          _id: device._id,
          name: device.name,
          description: device.description,
          image: device.image,
          category: device.category_id,
          inventory: {
            total: inventory.total,
            available: inventory.available,
            broken: inventory.broken,
            location: inventory.location
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

    const device = await Device.findById(id)
      .populate('category_id', 'name description');

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    const inventory = await Inventory.findOne({
      device_id: device._id,
      location: location || 'lab'
    });

    res.status(200).json({
      success: true,
      data: {
        _id: device._id,
        name: device.name,
        description: device.description,
        image: device.image,
        category: device.category_id,
        inventory: inventory ? {
          total: inventory.total,
          available: inventory.available,
          broken: inventory.broken,
          location: inventory.location
        } : null,
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

