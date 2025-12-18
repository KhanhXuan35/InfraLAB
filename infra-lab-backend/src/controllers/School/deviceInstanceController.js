import mongoose from "mongoose";
import Device from "../../models/Device.js";
import DeviceInstance from "../../models/DeviceInstance.js";
import Inventory from "../../models/Inventory.js";
import ActivityLogs from "../../models/ActivityLogs.js";
import Category from "../../models/Category.js";

// ===== CẤU HÌNH MÃ DOANH NGHIỆP =====
// Có thể lấy từ biến môi trường hoặc config, mặc định là "FU" (FPT University)
const COMPANY_CODE = process.env.COMPANY_CODE || "FU";

// Helper: Tạo mã mặt hàng từ tên thiết bị
const generateProductCode = (deviceName) => {
  const words = deviceName.toUpperCase().split(' ');
  // Lấy từ đầu tiên làm mã chính (ví dụ: "chuột" → "CHUOT")
  const mainCode = words[0]?.replace(/[^A-Z0-9]/g, '').substring(0, 8) || "DEV";
  
  // Nếu có từ thứ 2, thêm vào (ví dụ: "chuột không dây" → "CHUOT-KDD")
  const subCode = words[1] ? words[1].replace(/[^A-Z0-9]/g, '').substring(0, 3) : "";
  
  return subCode ? `${mainCode}-${subCode}` : mainCode;
};

// Helper: Tạo prefix đầy đủ cho serial number (MÃ_DOANH_NGHIỆP-MÃ_MẶT_HÀNG)
const generatePrefix = (deviceName) => {
  const productCode = generateProductCode(deviceName);
  return `${COMPANY_CODE}-${productCode}`;
};

// Helper: Tính ngày hết hạn bảo hành
const calculateWarrantyEnd = (purchaseDate, warrantyMonths) => {
  const date = new Date(purchaseDate);
  date.setMonth(date.getMonth() + warrantyMonths);
  return date;
};

// POST /api/school-admin/devices/create-with-instances
export const createDeviceWithInstances = async (req, res) => {
  try {
    const {
      // Device Model info
      name,
      category_id,        // Frontend đang gửi TEXT (VD: "chuột"), ta sẽ coi như tên danh mục
      description,
      image,
      
      // Purchase info (không quản lý giá bán, chỉ cần thông tin cơ bản)
      quantity,
      purchase_date,
      supplier,
      invoice_number,
      warranty_months,
      
      // Storage info
      initial_location,
      storage_position
    } = req.body;
    
    const createdBy = req.user._id;
    
    // ===== VALIDATION NHẸ NHÀNG CHO MÔI TRƯỜNG TRƯỜNG HỌC =====
    if (!name || !category_id) {
      return res.status(400).json({
        success: false,
        message: "Thiếu tên thiết bị hoặc danh mục"
      });
    }
    
    const safeQuantity = Number(quantity) || 1;
    if (safeQuantity < 1 || safeQuantity > 1000) {
      return res.status(400).json({
        success: false,
        message: "Số lượng phải từ 1 đến 1000"
      });
    }
    
    const safePurchaseDate = purchase_date ? new Date(purchase_date) : new Date();
    
    // ===== XỬ LÝ CATEGORY =====
    // Thiết kế cho môi trường trường học:
    // - Frontend truyền lên field "category_id" nhưng thực chất là TÊN DANH MỤC (VD: "chuột")
    // - Backend sẽ tự tìm / tạo Category theo name, rồi lấy _id để gán cho Device.category_id
    const categoryName = (category_id || "").toString().trim();
    if (!categoryName) {
      return res.status(400).json({
        success: false,
        message: "Thiếu tên danh mục",
      });
    }

    let category = await Category.findOne({ name: categoryName });
    if (!category) {
      category = await Category.create({
        name: categoryName,
        description: "",
      });
    }
    const resolvedCategoryId = category._id;

    // ===== KIỂM TRA TRÙNG TÊN THIẾT BỊ (KHÔNG PHÂN BIỆT HOA THƯỜNG) =====
    // Luôn kiểm tra, KHÔNG cho override bằng force để tránh trùng thiết bị
    {
      const trimmedName = (name || "").trim();
      // Regex để so khớp chính xác tên nhưng không phân biệt hoa/thường
      const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const nameRegex = new RegExp(`^${escapedName}$`, "i");

      // Lấy tất cả devices có cùng tên (bất kể danh mục)
      const devicesSameName = await Device.find({ name: nameRegex }).populate(
        "category_id",
        "name"
      );

      let sameCategoryDevice = null;
      let otherCategoryDevice = null;

      devicesSameName.forEach((d) => {
        if (d.category_id && d.category_id._id.equals(resolvedCategoryId)) {
          sameCategoryDevice = d;
        } else if (d.category_id) {
          otherCategoryDevice = d;
        }
      });

      // Trường hợp 1: Đã tồn tại thiết bị cùng tên ở DANH MỤC KHÁC → KHÔNG cho tạo, yêu cầu xem chi tiết
      if (otherCategoryDevice) {
        const existingInstances = await DeviceInstance.find({
          device_model_id: otherCategoryDevice._id,
        });

        const instancesByLocation = {};
        existingInstances.forEach((inst) => {
          const loc = inst.location || "unknown";
          instancesByLocation[loc] =
            (instancesByLocation[loc] || 0) + 1;
        });

        return res.status(409).json({
          success: false,
          message:
            "Thiết bị này đã tồn tại trong danh mục khác. Vui lòng thêm số lượng tại thiết bị đó.",
          duplicate: true,
          duplicateType: "other_category",
          existingDevice: {
            _id: otherCategoryDevice._id,
            name: otherCategoryDevice.name,
            category: {
              _id: otherCategoryDevice.category_id?._id,
              name: otherCategoryDevice.category_id?.name,
            },
            totalInstances: existingInstances.length,
            instancesByLocation,
            description: otherCategoryDevice.description,
            image: otherCategoryDevice.image,
          },
        });
      }

      // Trường hợp 2: Đã tồn tại thiết bị cùng tên trong CHÍNH DANH MỤC NÀY → hỏi có muốn thêm không
      if (sameCategoryDevice) {
        const existingInstances = await DeviceInstance.find({
          device_model_id: sameCategoryDevice._id,
        });

        const instancesByLocation = {};
        existingInstances.forEach((inst) => {
          const loc = inst.location || "unknown";
          instancesByLocation[loc] =
            (instancesByLocation[loc] || 0) + 1;
        });

        return res.status(409).json({
          success: false,
          message:
            "Đã có thiết bị trùng tên trong danh mục này. Bạn có muốn thêm số lượng không?",
          duplicate: true,
          duplicateType: "same_category",
          existingDevice: {
            _id: sameCategoryDevice._id,
            name: sameCategoryDevice.name,
            category: {
              _id: category._id,
              name: category.name,
            },
            totalInstances: existingInstances.length,
            instancesByLocation,
            description: sameCategoryDevice.description,
            image: sameCategoryDevice.image,
          },
        });
      }
    }

    // ===== BƯỚC 1: TẠO DEVICE MODEL =====
    const deviceModel = await Device.create({
      name,
      category_id: resolvedCategoryId,
      description: description || "",
      image: image || "",
      verify: true,  // School admin tạo → tự động verify
      createdBy,
      specifications: {
        warranty_months: warranty_months || 12
      }
    });
    
    // ===== BƯỚC 2: TỰ ĐỘNG TẠO DEVICE INSTANCES =====
    const instances = [];
    const productCode = generateProductCode(name); // Mã mặt hàng (VD: "CHUOT")
    const prefix = generatePrefix(name); // Mã đầy đủ: COMPANY_CODE-PRODUCT_CODE (VD: "FU-CHUOT")
    
    // Đếm số lượng thiết bị đã có cùng mã mặt hàng (để tạo số kiểm kê tiếp theo)
    // Format serial number: {MÃ_DOANH_NGHIỆP}-{MÃ_MẶT_HÀNG}-{SỐ_KIỂM_KÊ}
    // Ví dụ: FU-CHUOT-0001, FU-CHUOT-0002, ...
    const existingCount = await DeviceInstance.countDocuments({
      serial_number: { $regex: `^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-` }
    });
    
    const startIndex = existingCount + 1; // Số kiểm kê bắt đầu từ 1
    
    for (let i = 0; i < safeQuantity; i++) {
      // Format: {MÃ_DOANH_NGHIỆP}-{MÃ_MẶT_HÀNG}-{SỐ_KIỂM_KÊ}
      // Ví dụ: FU-CHUOT-0001, FU-CHUOT-0002, ...
      const inventoryNumber = String(startIndex + i).padStart(4, '0'); // Số kiểm kê (4 chữ số)
      const serialNumber = `${prefix}-${inventoryNumber}`;
      
      const instance = await DeviceInstance.create({
        device_model_id: deviceModel._id,
        
        // Mã định danh
        serial_number: serialNumber,
        manufacturer_serial: req.body.manufacturer_serials?.[i] || null,
        
        // Thông tin mua hàng (không lưu giá bán, chỉ lưu ngày mua & nhà cung cấp nếu có)
        purchase_date: safePurchaseDate,
        purchase_price: 0,
        supplier: supplier || null,
        invoice_number: invoice_number || null,
        warranty_until: calculateWarrantyEnd(safePurchaseDate, warranty_months || 12),
        
        // Trạng thái ban đầu
        status: "available",
        condition: "new",
        
        // Vị trí
        location: initial_location || "warehouse",
        storage_position: storage_position || null,
        
        // Thống kê
        usage_stats: {
          total_borrows: 0,
          total_repair_times: 0,
          total_repair_cost: 0,
          last_borrowed_at: null,
          last_borrowed_by: null
        },
        
        createdBy
      });
      
      instances.push(instance);
    }
    
    // ===== BƯỚC 3: CẬP NHẬT INVENTORY =====
    await Inventory.findOneAndUpdate(
      {
        device_id: deviceModel._id,
        location: initial_location || "warehouse"
      },
      {
        $inc: {
          total: safeQuantity,
          available: safeQuantity
        },
        $set: {
          last_updated: new Date()
        }
      },
      { upsert: true }
    );
    
    // ===== BƯỚC 4: TẠO ACTIVITY LOG =====
    await ActivityLogs.create({
      user_id: createdBy,
      action: "CREATE_DEVICE_WITH_INSTANCES",
      entity_type: "Device",
      entity_id: deviceModel._id,
      details: {
        device_name: name,
        quantity: safeQuantity,
        location: initial_location || "warehouse",
        serial_numbers: instances.map(i => i.serial_number)
      }
    });
    
    res.status(201).json({
      success: true,
      message: `Đã tạo thiết bị ${name} với ${quantity} chiếc`,
      data: {
        device_model: deviceModel,
        instances: instances,
        summary: {
          total_instances: instances.length,
          location: initial_location || "warehouse",
          serial_numbers: instances.map(i => i.serial_number)
        }
      }
    });
    
  } catch (error) {
    console.error("Create device error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET /api/school-admin/devices/:deviceId/instances
export const getDeviceInstances = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { location, status, condition, page = 1, limit = 50 } = req.query;
    
    const query = { device_model_id: deviceId };
    
    if (location) query.location = location;
    if (status) query.status = status;
    if (condition) query.condition = condition;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const instances = await DeviceInstance.find(query)
      .populate('current_holder.user_id', 'name email student_code')
      .sort({ serial_number: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await DeviceInstance.countDocuments(query);
    
    res.json({
      success: true,
      data: instances,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/school-admin/devices/:deviceId/add-instances
// Thêm số lượng instances vào thiết bị đã có
export const addInstancesToDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const {
      quantity,
      purchase_date,
      supplier,
      invoice_number,
      warranty_months,
      initial_location,
      storage_position
    } = req.body;

    const createdBy = req.user._id;

    // Validate
    if (!quantity || quantity < 1 || quantity > 1000) {
      return res.status(400).json({
        success: false,
        message: "Số lượng phải từ 1 đến 1000"
      });
    }

    // Tìm device
    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thiết bị"
      });
    }

    const safePurchaseDate = purchase_date ? new Date(purchase_date) : new Date();

    // Tạo instances mới
    const instances = [];
    const productCode = generateProductCode(device.name); // Mã mặt hàng (VD: "CHUOT")
    const prefix = generatePrefix(device.name); // Mã đầy đủ: COMPANY_CODE-PRODUCT_CODE (VD: "FU-CHUOT")

    // Đếm số lượng thiết bị đã có cùng mã mặt hàng (để tạo số kiểm kê tiếp theo)
    // Format serial number: {MÃ_DOANH_NGHIỆP}-{MÃ_MẶT_HÀNG}-{SỐ_KIỂM_KÊ}
    const existingCount = await DeviceInstance.countDocuments({
      serial_number: { $regex: `^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-` }
    });

    const startIndex = existingCount + 1; // Số kiểm kê bắt đầu từ 1

    for (let i = 0; i < quantity; i++) {
      // Format: {MÃ_DOANH_NGHIỆP}-{MÃ_MẶT_HÀNG}-{SỐ_KIỂM_KÊ}
      // Ví dụ: FU-CHUOT-0001, FU-CHUOT-0002, ...
      const inventoryNumber = String(startIndex + i).padStart(4, '0'); // Số kiểm kê (4 chữ số)
      const serialNumber = `${prefix}-${inventoryNumber}`;

      const instance = await DeviceInstance.create({
        device_model_id: device._id,
        serial_number: serialNumber,
        manufacturer_serial: req.body.manufacturer_serials?.[i] || null,
        purchase_date: safePurchaseDate,
        purchase_price: 0,
        supplier: supplier || null,
        invoice_number: invoice_number || null,
        warranty_until: calculateWarrantyEnd(safePurchaseDate, warranty_months || 12),
        status: "available",
        condition: "new",
        location: initial_location || "warehouse",
        storage_position: storage_position || null,
        usage_stats: {
          total_borrows: 0,
          total_repair_times: 0,
          total_repair_cost: 0,
          last_borrowed_at: null,
          last_borrowed_by: null
        },
        createdBy
      });

      instances.push(instance);
    }

    // Cập nhật Inventory
    await Inventory.findOneAndUpdate(
      {
        device_id: device._id,
        location: initial_location || "warehouse"
      },
      {
        $inc: {
          total: quantity,
          available: quantity
        },
        $set: {
          last_updated: new Date()
        }
      },
      { upsert: true }
    );

    // Tạo Activity Log
    await ActivityLogs.create({
      user_id: createdBy,
      action: "ADD_INSTANCES_TO_DEVICE",
      entity_type: "Device",
      entity_id: device._id,
      details: {
        device_name: device.name,
        quantity_added: quantity,
        location: initial_location || "warehouse",
        serial_numbers: instances.map(i => i.serial_number)
      }
    });

    res.status(201).json({
      success: true,
      message: `Đã thêm ${quantity} chiếc vào thiết bị ${device.name}`,
      data: {
        device_id: device._id,
        instances_added: instances.length,
        serial_numbers: instances.map(i => i.serial_number)
      }
    });

  } catch (error) {
    console.error("Add instances error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET /api/school-admin/devices/instances/stats
export const getInstancesStats = async (req, res) => {
  try {
    const stats = await DeviceInstance.aggregate([
      {
        $group: {
          _id: {
            location: "$location",
            status: "$status"
          },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const conditionStats = await DeviceInstance.aggregate([
      {
        $group: {
          _id: "$condition",
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totalValue = await DeviceInstance.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$purchase_price" }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        by_location_status: stats,
        by_condition: conditionStats,
        total_value: totalValue[0]?.total || 0,
        total_instances: await DeviceInstance.countDocuments()
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

