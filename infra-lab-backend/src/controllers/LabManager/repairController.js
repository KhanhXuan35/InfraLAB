import Repair from "../../models/Repair.js";
import Device from "../../models/Device.js";

/**
 * POST /api/repairs
 * body: { device_id, reason, quantity }
 */
export const createRepairRequest = async (req, res) => {
  try {
    const { device_id, reason, quantity } = req.body;

    if (!device_id || !reason) {
      return res
        .status(400)
        .json({ success: false, message: "device_id và reason là bắt buộc" });
    }

    // ✅ 1. Kiểm tra device có tồn tại không
    const device = await Device.findById(device_id);
    if (!device) {
      return res
        .status(404)
        .json({ success: false, message: "Device not found" });
    }

    // ✅ 2. CHẶN TẠO TRÙNG KHI ĐANG CÓ YÊU CẦU CHƯA HOÀN THÀNH
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

    // ✅ 3. CHƯA CÓ → TẠO MỚI
    const repair = await Repair.create({
      device_id,
      reason,
      quantity: quantity || 1,
      status: "pending", // ✅ đảm bảo luôn có trạng thái ban đầu
    });

    res.status(201).json({ success: true, data: repair });
  } catch (err) {
    console.error("createRepairRequest error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};
/**
 * GET /api/repairs
 * query: status (optional) -> ?status=pending
 * dùng cho School để xem danh sách yêu cầu
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
 * PATCH /api/repairs/:id/status
 * body: { status }  // approved | in_progress | done | rejected
 */
export const updateRepairStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (
      !["approved", "in_progress", "done", "rejected"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const update = { status };

    if (status === "approved" || status === "rejected") {
      update.reviewed_at = new Date();
    }
    if (status === "done") {
      update.completed_at = new Date();
    }

    const repair = await Repair.findByIdAndUpdate(id, update, {
      new: true,
    }).populate("device_id");

    if (!repair) {
      return res
        .status(404)
        .json({ success: false, message: "Repair request not found" });
    }

    res.json({ success: true, data: repair });
  } catch (err) {
    console.error("updateRepairStatus error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};
