// controllers/LabManager/repairController.js
import Repair from "../../models/Repair.js";
import Device from "../../models/Device.js";
import Inventory from "../../models/Inventory.js";
import DeviceInstance from "../../models/DeviceInstance.js";
import uploadBufferToCloud from "../../utils/uploadToCloud.js";

/**
 * POST /api/repairs
 * body: { device_id, reason, quantity }
 * Lab Manager tạo yêu cầu sửa chữa
 */
export const createRepairRequest = async (req, res) => {
  try {
    const { device_id, quantity, reason, inventory_id, device_instance_id, serial_number, symptom } = req.body;

    if (!device_id || !reason || !inventory_id) {
      return res.status(400).json({
        success: false,
        message: "device_id, inventory_id và reason là bắt buộc",
      });
    }



    // 1. Kiểm tra thiết bị tồn tại
    const device = await Device.findById(device_id);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found"
      });
    }

    // 2. ✅ KIỂM TRA DEVICE INSTANCE TRƯỚC
    let instance = null;
    if (device_instance_id) {
      instance = await DeviceInstance.findById(device_instance_id);

      if (!instance) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy mã thiết bị (serial)."
        });
      }

      if (instance.status === "borrowed") {
        return res.status(400).json({
          success: false,
          message: "Thiết bị đang được mượn, không thể tạo yêu cầu sửa chữa."
        });
      }

      if (["broken", "repairing", "maintenance"].includes(instance.status)) {
        return res.status(400).json({
          success: false,
          message: "Thiết bị đang trong trạng thái sửa chữa/bảo trì."
        });
      }
    }

    // 3. ✅ SAU ĐÓ MỚI CHECK TRÙNG REPAIR
    const existingFilter = {
      device_id,
      status: { $in: ["pending", "approved", "in_progress"] },
    };

    if (device_instance_id) {
      existingFilter.device_instance_id = device_instance_id;
    }

    const existingRepair = await Repair.findOne(existingFilter);
    if (existingRepair) {
      return res.status(400).json({
        success: false,
        message: "Thiết bị này đã có yêu cầu sửa chữa đang được xử lý."
      });
    }

    // 3. Kiểm tra số lượng available
    const inventory = await Inventory.findById(inventory_id);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found"
      });
    }

    const requestQuantity = parseInt(quantity) || 1;
    if (requestQuantity > inventory.available) {
      return res.status(400).json({
        success: false,
        message: `Không đủ thiết bị có sẵn. Chỉ còn ${inventory.available} thiết bị.`
      });
    }

    // 4. Upload ảnh nếu có
    let imageUrl = null;
    if (req.file) {
      console.log("Received file:", req.file);
      imageUrl = await uploadBufferToCloud(req.file.buffer, req.file.mimetype);
      console.log("Uploaded URL:", imageUrl);
    }

    // 5. Tạo yêu cầu sửa chữa
    const repair = await Repair.create({
      device_id,
      quantity: requestQuantity,
      reason,
      // Lưu thêm symptom nếu frontend gửi lên
      broken_parts: symptom ? [symptom] : [],
      image: imageUrl,
      status: "pending",
      inventory_id: inventory_id,
      device_instance_id: device_instance_id || null,
      serial_number: serial_number || null,
    });

    // 6. Cập nhật tồn kho & trạng thái instance
    await Inventory.findByIdAndUpdate(
      repair.inventory_id,
      {
        $inc: {
          broken: repair.quantity,
          available: -repair.quantity,
        },
      }
    );

    // Nếu có truyền device_instance_id thì set trạng thái instance sang "broken"
    if (device_instance_id) {
      await DeviceInstance.findByIdAndUpdate(device_instance_id, {
        $set: {
          status: "broken",
        },
        $inc: {
          "usage_stats.total_repair_times": 1,
        },
      });
    }

    res.status(201).json({ success: true, data: repair });
  } catch (err) {
    console.error("createRepairRequest error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/repairs
 * query: status (optional) -> ?status=pending
 * School Admin (hoặc Lab Manager) xem danh sách yêu cầu
 */
export const getRepairs = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (status && status !== "all") {
      filter.status = status;
    }

    const repairs = await Repair.find(filter)
      .populate({
        path: "device_id",
        select: "name image",
      })
      .select("device_id quantity reason image status reason_rejected createdAt reviewed_at completed_at")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: repairs });
  } catch (err) {
    console.error("getRepairs error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

/**
 * GET /api/repairs/:id
 * Lấy chi tiết một yêu cầu sửa chữa
 */
export const getRepairById = async (req, res) => {
  try {
    const repair = await Repair.findById(req.params.id)
      .populate({
        path: "device_id",
        select: "name image description",
      })
      .populate({
        path: "device_instance_id",
        select: "serial_number status location condition",
      })
      .select("device_id device_instance_id serial_number quantity reason image status reason_rejected createdAt reviewed_at completed_at")
      .lean();

    if (!repair) {
      return res
        .status(404)
        .json({ success: false, message: "Repair request not found" });
    }

    res.json({ success: true, data: repair });
  } catch (err) {
    console.error("getRepairById error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

/**
 * GET /api/repairs/my
 * Lab Manager xem các yêu cầu mình tạo
 * (cần middleware auth set req.user._id)
 */
export const getMyRepairRequests = async (req, res) => {
  try {
    const userId = req.user?._id;

    const filter = {};
    if (userId) {
      filter.created_by = userId;
    }

    const repairs = await Repair.find(filter)
      .populate({
        path: "device_id",
        select: "name image",
      })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: repairs });
  } catch (err) {
    console.error("getMyRepairRequests error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

/**
 * PATCH /api/repairs/:id/status
 * body: { status }  // approved | in_progress | done | rejected
 * School Admin cập nhật trạng thái
 */
export const updateRepairStatus = async (req, res) => {
  try {
    const { status, reason_rejected } = req.body;
    const repair = await Repair.findById(req.params.id);

    if (!repair)
      return res.status(404).json({ success: false, message: "Không tìm thấy yêu cầu." });

    const oldStatus = repair.status;
    repair.status = status;

    // Xử lý inventory khi status thay đổi
    const inventory = await Inventory.findById(repair.inventory_id);
    if (!inventory) {
      return res.status(404).json({ success: false, message: "Không tìm thấy inventory." });
    }

    // Lấy instance nếu có để cập nhật trạng thái
    const instanceId = repair.device_instance_id;

    // ✅ Nếu sửa xong → hoàn lại available, giảm broken
    if (status === "done") {
      repair.completed_at = new Date();

      inventory.broken = Math.max(0, inventory.broken - repair.quantity);
      inventory.available = Math.min(
        inventory.total - inventory.broken,
        inventory.available + repair.quantity
      );

      await inventory.save();

      // Trả thiết bị về trạng thái available
      if (instanceId) {
        await DeviceInstance.findByIdAndUpdate(instanceId, {
          $set: {
            status: "available",
          },
        });
      }
    }

    // ✅ Nếu reject → hoàn lại available, giảm broken (vì thiết bị không thực sự hỏng)
    if (status === "rejected" && oldStatus === "pending") {
      inventory.broken = Math.max(0, inventory.broken - repair.quantity);
      inventory.available = Math.min(
        inventory.total - inventory.broken,
        inventory.available + repair.quantity
      );

      await inventory.save();

      // Khôi phục trạng thái instance về available
      if (instanceId) {
        await DeviceInstance.findByIdAndUpdate(instanceId, {
          $set: {
            status: "available",
          },
        });
      }

      repair.reason_rejected = reason_rejected || "Không có lý do";

    }

    // Khi admin duyệt thì lưu ngày duyệt
    if (status === "approved") {
      repair.reviewed_at = new Date();
    }

    await repair.save();

    res.json({
      success: true,
      message: "Cập nhật trạng thái thành công.",
      data: repair,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi server." });
  }
};

export const getRepairByDevice = async (req, res) => {
  try {
    const repair = await Repair.findOne({
      device_id: req.params.deviceId,
      status: { $in: ["pending", "approved", "in_progress"] }
    })
      .sort({ createdAt: -1 });

    if (!repair)
      return res.status(200).json({
        success: true,
        data: null
      });

    res.json({
      success: true,
      data: repair
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};