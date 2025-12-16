import RequestLab from "../../../models/requestlab.js";
import Device from "../../../models/Device.js";

/**
 * Lab Manager tạo yêu cầu mượn thiết bị từ warehouse
 * POST /api/request-lab
 */
export const createBorrowRequest = async (req, res) => {
  try {
    const { device_id, qty, user_id } = req.body;
    const userId = req.user?._id || user_id || req.body.created_by;

    if (!device_id || !qty || Number(qty) <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu device_id hoặc qty không hợp lệ" });
    }
    if (!userId) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin người tạo (created_by)" });
    }

    const device = await Device.findById(device_id);
    if (!device) {
      return res.status(404).json({ success: false, message: "Không tìm thấy thiết bị" });
    }

    const request = await RequestLab.create({
      device_id,
      qty: Number(qty),
      created_by: userId,
      status: "WAITING",
    });

    return res.status(201).json({ success: true, data: request });
  } catch (err) {
    console.error("createBorrowRequest error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

