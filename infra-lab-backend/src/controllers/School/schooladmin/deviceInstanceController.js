import mongoose from "mongoose";
import Device from "../../../models/Device.js";
import DeviceInstance from "../../../models/DeviceInstance.js";
import Inventory from "../../../models/Inventory.js";
import ActivityLogs from "../../../models/ActivityLogs.js";
import Category from "../../../models/Category.js";

const COMPANY_CODE = process.env.COMPANY_CODE || "FU";


/**
 * Tạo mã mặt hàng từ tên thiết bị
 * Ví dụ: "Chuột Logitech" → "CHUOT"
 */
const generateProductCode = (deviceName) => {
  const nameUpper = deviceName.toUpperCase();
  const words = nameUpper.split(' ');
  
  // Lấy từ đầu tiên
  let mainCode = "DEV";
  if (words.length > 0 && words[0]) {
    mainCode = words[0].replace(/[^A-Z0-9]/g, '');
    if (mainCode.length > 8) {
      mainCode = mainCode.substring(0, 8);
    }
  }
  
  // Lấy từ thứ 2 (nếu có)
  let subCode = "";
  if (words.length > 1 && words[1]) {
    subCode = words[1].replace(/[^A-Z0-9]/g, '');
    if (subCode.length > 3) {
      subCode = subCode.substring(0, 3);
    }
  }
  
  if (subCode) {
    return mainCode + "-" + subCode;
  }
  return mainCode;
};

/**
 * Tạo prefix cho serial number
 * Format: MÃ_DOANH_NGHIỆP-MÃ_MẶT_HÀNG
 * Ví dụ: "FU-CHUOT"
 */
const generatePrefix = (deviceName) => {
  const productCode = generateProductCode(deviceName);
  return COMPANY_CODE + "-" + productCode;
};

/**
 * Tính ngày hết hạn bảo hành
 */
const calculateWarrantyEnd = (purchaseDate, warrantyMonths) => {
  const date = new Date(purchaseDate);
  const months = warrantyMonths || 12;
  date.setMonth(date.getMonth() + months);
  return date;
};

/**
 * Đếm số lượng instances theo location
 */
const countInstancesByLocation = (instances) => {
  const result = {};
  for (let i = 0; i < instances.length; i++) {
    const location = instances[i].location || "unknown";
    if (result[location]) {
      result[location] = result[location] + 1;
    } else {
      result[location] = 1;
    }
  }
  return result;
};

// ============================================
// API: TẠO THIẾT BỊ MỚI VÀ TỰ ĐỘNG SINH MÃ
// POST /api/school-admin/devices/create-with-instances
// ============================================

/**
 * Tạo thiết bị mới và tự động sinh mã serial cho từng sản phẩm
 * 
 * Luồng xử lý:
 * 1. Lấy dữ liệu từ request (tên, danh mục, số lượng, ...)
 * 2. Kiểm tra dữ liệu hợp lệ
 * 3. Tìm hoặc tạo Category
 * 4. Kiểm tra trùng tên thiết bị
 * 5. Tạo Device Model
 * 6. Tạo Device Instances (tự động sinh serial number)
 * 7. Cập nhật Inventory
 * 8. Ghi Activity Log
 * 9. Trả về kết quả
 */
export const createDeviceWithInstances = async (req, res) => {
  try {
    // ===== BƯỚC 1: LẤY DỮ LIỆU TỪ REQUEST =====
    const name = req.body.name;
    const category_id = req.body.category_id; // Frontend gửi lên là TÊN danh mục (VD: "chuột")
    const description = req.body.description || "";
    const image = req.body.image || "";
    const quantity = req.body.quantity;
    const purchase_date = req.body.purchase_date;
    const supplier = req.body.supplier || "";
    const invoice_number = req.body.invoice_number || "";
    const warranty_months = req.body.warranty_months || 12;
    const initial_location = req.body.initial_location || "warehouse";
    const storage_position = req.body.storage_position || "";
    const createdBy = req.user._id; // Lấy từ token

    // ===== BƯỚC 2: KIỂM TRA DỮ LIỆU ĐẦU VÀO =====
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

    let safePurchaseDate = new Date();
    if (purchase_date) {
      safePurchaseDate = new Date(purchase_date);
    }

    // ===== BƯỚC 3: XỬ LÝ CATEGORY =====
    // Frontend gửi TÊN danh mục, Backend tự tìm hoặc tạo mới
    const categoryName = String(category_id || "").trim();
    if (!categoryName) {
      return res.status(400).json({
        success: false,
        message: "Thiếu tên danh mục"
      });
    }

    let category = await Category.findOne({ name: categoryName });
    if (!category) {
      category = await Category.create({
        name: categoryName,
        description: ""
      });
    }
    const resolvedCategoryId = category._id;

    // ===== BƯỚC 4: KIỂM TRA TRÙNG TÊN THIẾT BỊ =====
    const trimmedName = String(name || "").trim();
    
    // Tìm thiết bị trùng tên (không phân biệt hoa thường)
    const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const nameRegex = new RegExp("^" + escapedName + "$", "i");
    const devicesSameName = await Device.find({ name: nameRegex })
      .populate("category_id", "name");

    // Phân loại: cùng danh mục hay khác danh mục
    let sameCategoryDevice = null;
    let otherCategoryDevice = null;
    for (let i = 0; i < devicesSameName.length; i++) {
      const device = devicesSameName[i];
      if (device.category_id && device.category_id._id.equals(resolvedCategoryId)) {
        sameCategoryDevice = device;
      } else if (device.category_id) {
        otherCategoryDevice = device;
      }
    }

    // Trường hợp 1: Trùng tên ở DANH MỤC KHÁC
    if (otherCategoryDevice) {
      const existingInstances = await DeviceInstance.find({
        device_model_id: otherCategoryDevice._id
      });
      const instancesByLocation = countInstancesByLocation(existingInstances);

      return res.status(409).json({
        success: false,
        message: "Thiết bị này đã tồn tại trong danh mục khác. Vui lòng thêm số lượng tại thiết bị đó.",
        duplicate: true,
        duplicateType: "other_category",
        existingDevice: {
          _id: otherCategoryDevice._id,
          name: otherCategoryDevice.name,
          category: {
            _id: otherCategoryDevice.category_id ? otherCategoryDevice.category_id._id : null,
            name: otherCategoryDevice.category_id ? otherCategoryDevice.category_id.name : ""
          },
          totalInstances: existingInstances.length,
          instancesByLocation: instancesByLocation,
          description: otherCategoryDevice.description,
          image: otherCategoryDevice.image
        }
      });
    }

    // Trường hợp 2: Trùng tên trong CÙNG DANH MỤC
    if (sameCategoryDevice) {
      const existingInstances = await DeviceInstance.find({
        device_model_id: sameCategoryDevice._id
      });
      const instancesByLocation = countInstancesByLocation(existingInstances);

      return res.status(409).json({
        success: false,
        message: "Đã có thiết bị trùng tên trong danh mục này. Bạn có muốn thêm số lượng không?",
        duplicate: true,
        duplicateType: "same_category",
        existingDevice: {
          _id: sameCategoryDevice._id,
          name: sameCategoryDevice.name,
          category: {
            _id: category._id,
            name: category.name
          },
          totalInstances: existingInstances.length,
          instancesByLocation: instancesByLocation,
          description: sameCategoryDevice.description,
          image: sameCategoryDevice.image
        }
      });
    }

    // ===== BƯỚC 5: TẠO DEVICE MODEL =====
    const deviceModel = await Device.create({
      name: trimmedName,
      category_id: resolvedCategoryId,
      description: description,
      image: image,
      verify: true,  // School admin tạo → tự động verify
      createdBy: createdBy,
      specifications: {
        warranty_months: warranty_months
      }
    });

    // ===== BƯỚC 6: TẠO DEVICE INSTANCES (TỰ ĐỘNG SINH SERIAL NUMBER) =====
    // Format serial number: {MÃ_DOANH_NGHIỆP}-{MÃ_MẶT_HÀNG}-{SỐ_KIỂM_KÊ}
    // Ví dụ: FU-CHUOT-0001, FU-CHUOT-0002, ...
    const prefix = generatePrefix(trimmedName); // VD: "FU-CHUOT"
    
    // Đếm số lượng thiết bị đã có cùng prefix (để tạo số tiếp theo)
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const prefixRegex = "^" + escapedPrefix + "-";
    const existingCount = await DeviceInstance.countDocuments({
      serial_number: { $regex: prefixRegex }
    });
    const startIndex = existingCount + 1; // Bắt đầu từ số tiếp theo

    // Tạo từng instance
    const instances = [];
    for (let i = 0; i < safeQuantity; i++) {
      // Tạo số kiểm kê (4 chữ số): 0001, 0002, ...
      const inventoryNumber = String(startIndex + i).padStart(4, '0');
      const serialNumber = prefix + "-" + inventoryNumber; // VD: "FU-CHUOT-0001"

      // Tính ngày hết hạn bảo hành
      const warrantyEndDate = calculateWarrantyEnd(safePurchaseDate, warranty_months);

      // Tạo instance mới
      const instance = await DeviceInstance.create({
        device_model_id: deviceModel._id,
        serial_number: serialNumber,
        manufacturer_serial: null,
        purchase_date: safePurchaseDate,
        purchase_price: 0,
        supplier: supplier || null,
        invoice_number: invoice_number || null,
        warranty_until: warrantyEndDate,
        status: "available",
        condition: "new",
        location: initial_location,
        storage_position: storage_position || null,
        usage_stats: {
          total_borrows: 0,
          total_repair_times: 0,
          total_repair_cost: 0,
          last_borrowed_at: null,
          last_borrowed_by: null
        },
        createdBy: createdBy
      });

      instances.push(instance);
    }

    // ===== BƯỚC 7: CẬP NHẬT INVENTORY =====
    await Inventory.findOneAndUpdate(
      {
        device_id: deviceModel._id,
        location: initial_location
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

    // ===== BƯỚC 8: GHI ACTIVITY LOG =====
    const serialNumbers = instances.map(inst => inst.serial_number);
    await ActivityLogs.create({
      user_id: createdBy,
      action: "CREATE_DEVICE_WITH_INSTANCES",
      entity_type: "Device",
      entity_id: deviceModel._id,
      details: {
        device_name: trimmedName,
        quantity: safeQuantity,
        location: initial_location,
        serial_numbers: serialNumbers
      }
    });

    // ===== BƯỚC 9: TRẢ VỀ KẾT QUẢ =====
    res.status(201).json({
      success: true,
      message: "Đã tạo thiết bị " + trimmedName + " với " + safeQuantity + " chiếc",
      data: {
        device_model: deviceModel,
        instances: instances,
        summary: {
          total_instances: instances.length,
          location: initial_location,
          serial_numbers: serialNumbers
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

// ============================================
// API: LẤY DANH SÁCH INSTANCES CỦA MỘT THIẾT BỊ
// GET /api/school-admin/devices/:deviceId/instances
// ============================================

/**
 * Lấy danh sách instances (serial numbers) của một thiết bị
 * Hỗ trợ lọc theo location, status, condition và phân trang
 */
export const getDeviceInstances = async (req, res) => {
  try {
    // Lấy tham số từ request
    const deviceId = req.params.deviceId;
    const location = req.query.location;
    const status = req.query.status;
    const condition = req.query.condition;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    // Tạo query filter
    const query = { device_model_id: deviceId };
    if (location) query.location = location;
    if (status) query.status = status;
    if (condition) query.condition = condition;

    // Tính toán phân trang
    const skip = (page - 1) * limit;

    // Tìm instances
    const instances = await DeviceInstance.find(query)
      .populate('current_holder.user_id', 'name email student_code')
      .sort({ serial_number: 1 })
      .skip(skip)
      .limit(limit);

    // Đếm tổng số
    const total = await DeviceInstance.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Trả về kết quả
    res.json({
      success: true,
      data: instances,
      pagination: {
        page: page,
        limit: limit,
        total: total,
        totalPages: totalPages
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// API: THÊM SỐ LƯỢNG INSTANCES VÀO THIẾT BỊ ĐÃ CÓ
// POST /api/school-admin/devices/:deviceId/add-instances
// ============================================

/**
 * Thêm số lượng instances (serial numbers) vào thiết bị đã tồn tại
 * Tự động sinh serial number tiếp theo
 */
export const addInstancesToDevice = async (req, res) => {
  try {
    // Lấy tham số từ request
    const deviceId = req.params.deviceId;
    const quantity = req.body.quantity;
    const purchase_date = req.body.purchase_date;
    const supplier = req.body.supplier || "";
    const invoice_number = req.body.invoice_number || "";
    const warranty_months = req.body.warranty_months || 12;
    const initial_location = req.body.initial_location || "warehouse";
    const storage_position = req.body.storage_position || "";
    const createdBy = req.user._id;

    // Kiểm tra dữ liệu đầu vào
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

    // Xử lý ngày mua
    let safePurchaseDate = new Date();
    if (purchase_date) {
      safePurchaseDate = new Date(purchase_date);
    }

    // Tạo instances mới (tự động sinh serial number)
    const prefix = generatePrefix(device.name);
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const prefixRegex = "^" + escapedPrefix + "-";
    const existingCount = await DeviceInstance.countDocuments({
      serial_number: { $regex: prefixRegex }
    });
    const startIndex = existingCount + 1;

    const instances = [];
    for (let i = 0; i < quantity; i++) {
      const inventoryNumber = String(startIndex + i).padStart(4, '0');
      const serialNumber = prefix + "-" + inventoryNumber;
      const warrantyEndDate = calculateWarrantyEnd(safePurchaseDate, warranty_months);

      const instance = await DeviceInstance.create({
        device_model_id: device._id,
        serial_number: serialNumber,
        manufacturer_serial: null,
        purchase_date: safePurchaseDate,
        purchase_price: 0,
        supplier: supplier || null,
        invoice_number: invoice_number || null,
        warranty_until: warrantyEndDate,
        status: "available",
        condition: "new",
        location: initial_location,
        storage_position: storage_position || null,
        usage_stats: {
          total_borrows: 0,
          total_repair_times: 0,
          total_repair_cost: 0,
          last_borrowed_at: null,
          last_borrowed_by: null
        },
        createdBy: createdBy
      });

      instances.push(instance);
    }

    // Cập nhật Inventory
    await Inventory.findOneAndUpdate(
      {
        device_id: device._id,
        location: initial_location
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

    // Ghi Activity Log
    const serialNumbers = instances.map(inst => inst.serial_number);
    await ActivityLogs.create({
      user_id: createdBy,
      action: "ADD_INSTANCES_TO_DEVICE",
      entity_type: "Device",
      entity_id: device._id,
      details: {
        device_name: device.name,
        quantity_added: quantity,
        location: initial_location,
        serial_numbers: serialNumbers
      }
    });

    // Trả về kết quả
    res.status(201).json({
      success: true,
      message: "Đã thêm " + quantity + " chiếc vào thiết bị " + device.name,
      data: {
        device_id: device._id,
        instances_added: instances.length,
        serial_numbers: serialNumbers
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

// ============================================
// API: LẤY THỐNG KÊ VỀ INSTANCES
// GET /api/school-admin/devices/instances/stats
// ============================================

/**
 * Lấy thống kê về instances theo location, status, condition
 */
export const getInstancesStats = async (req, res) => {
  try {
    // Thống kê theo location và status
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

    // Thống kê theo condition
    const conditionStats = await DeviceInstance.aggregate([
      {
        $group: {
          _id: "$condition",
          count: { $sum: 1 }
        }
      }
    ]);

    // Tính tổng giá trị
    const totalValue = await DeviceInstance.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$purchase_price" }
        }
      }
    ]);

    // Đếm tổng số instances
    const totalInstances = await DeviceInstance.countDocuments();

    // Lấy giá trị tổng
    let totalValueResult = 0;
    if (totalValue.length > 0 && totalValue[0].total) {
      totalValueResult = totalValue[0].total;
    }

    // Trả về kết quả
    res.json({
      success: true,
      data: {
        by_location_status: stats,
        by_condition: conditionStats,
        total_value: totalValueResult,
        total_instances: totalInstances
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
