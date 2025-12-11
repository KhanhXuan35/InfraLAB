// controllers/LabManager/repairController.js
import Repair from "../../models/Repair.js";
import Device from "../../models/Device.js";
import Inventory from "../../models/Inventory.js";
import uploadToCloud from "../../utils/uploadToCloud.js";

/**
 * POST /api/repairs
 * body: { device_id, reason, quantity }
 * Lab Manager tạo yêu cầu sửa chữa
 */
// FINAL VERSION – DO NOT DUPLICATE
export const createRepairRequest = async (req, res) => {
  try {
    const { device_id, quantity, reason } = req.body;

    if (!device_id || !reason) {
      return res.status(400).json({
        success: false,
        message: "device_id và reason là bắt buộc",
      });
    }

    // 1. Kiểm tra thiết bị tồn tại
    const device = await Device.findById(device_id);
    if (!device) {
      return res
        .status(404)
        .json({ success: false, message: "Device not found" });
    }

    // 2. Chặn tạo trùng khi đang có yêu cầu chưa hoàn thành
    const existingRepair = await Repair.findOne({
      device_id,
      status: { $in: ["pending", "approved", "in_progress"] },
    });

    if (existingRepair) {
      return res.status(400).json({
        success: false,
        message:
          "Thiết bị này đã có yêu cầu sửa chữa đang được xử lý, không thể tạo thêm!",
      });
    }

    // 3. Upload ảnh nếu có
    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadToCloud(req.file); // tự viết hoặc mình viết giúp bạn
    }

    // 4. Tạo yêu cầu sửa chữa
    const repair = await Repair.create({
      device_id,
      quantity: quantity || 1,
      reason,
      image: imageUrl,
      status: "pending",
    });

    // 5. Cập nhật tồn kho
    await Inventory.findOneAndUpdate(
      { device_id },
      {
        $inc: {
          broken: repair.quantity,
          available: -repair.quantity,
        },
      }
    );

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
    const userId = req.user?._id; // tuỳ bạn lưu thế nào

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
    const { status } = req.body;
    const repair = await Repair.findById(req.params.id);

    if (!repair)
      return res.status(404).json({ success: false, message: "Không tìm thấy yêu cầu." });

    repair.status = status;

    // Nếu sửa xong → cập nhật tồn kho
    if (status === "done") {
      repair.completed_at = new Date();

      const inventory = await Inventory.findOne({
        device_id: repair.device_id,
        location: "lab",
      });

      if (!inventory)
        return res.json({ success: false, message: "Không tìm thấy inventory." });

      inventory.broken = Math.max(0, inventory.broken - repair.quantity);
      inventory.available = (inventory.available || 0) + repair.quantity;

      await inventory.save();
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
        const repair = await Repair.findOne({ device_id: req.params.deviceId })
            .sort({ createdAt: -1 });

        if (!repair)
            return res.status(404).json({
                success: false,
                message: "Not Found"
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
