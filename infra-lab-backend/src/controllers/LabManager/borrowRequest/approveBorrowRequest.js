import RequestLab from "../../../models/requestlab.js";
import Inventory from "../../../models/Inventory.js";
import Device from "../../../models/Device.js";

/**
 * School Admin duyệt yêu cầu mượn thiết bị
 * PATCH /api/request-lab/:id/approve
 * 
 * Logic:
 * 1. Kiểm tra yêu cầu và tồn kho warehouse
 * 2. Trừ kho warehouse (giảm available)
 * 3. Cộng vào kho lab (tăng total và available)
 * 4. Cập nhật trạng thái yêu cầu
 */
export const approveBorrowRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const approverId = req.user?._id || body.user_id || body.created_by || null;

    const request = await RequestLab.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Không tìm thấy yêu cầu" });
    }
    if (request.status !== "WAITING") {
      return res.status(400).json({ success: false, message: "Yêu cầu không ở trạng thái chờ" });
    }
    if (!request.device_id) {
      return res.status(400).json({ success: false, message: "Yêu cầu thiếu thông tin thiết bị" });
    }

    const device = await Device.findById(request.device_id);
    if (!device) {
      return res.status(404).json({ success: false, message: "Thiết bị không tồn tại" });
    }

    // Kiểm tra tồn kho warehouse
    const invWarehouse = await Inventory.findOne({
      device_id: request.device_id,
      location: "warehouse",
    });
    if (!invWarehouse || (invWarehouse.available || 0) < request.qty) {
      return res.status(400).json({ success: false, message: "Kho school không đủ số lượng" });
    }

    // Trừ kho school (giảm available, tăng borrowed, giữ nguyên total)
    invWarehouse.available -= request.qty;
    invWarehouse.borrowed = (invWarehouse.borrowed || 0) + request.qty;
    await invWarehouse.save();

    // Cộng vào kho lab
    let invLab = await Inventory.findOne({
      device_id: request.device_id,
      location: "lab",
    });
    if (!invLab) {
      invLab = await Inventory.create({
        device_id: request.device_id,
        location: "lab",
        total: request.qty,
        available: request.qty,
        broken: 0,
      });
    } else {
      invLab.total = (invLab.total || 0) + request.qty;
      invLab.available = (invLab.available || 0) + request.qty;
      await invLab.save();
    }

    // Cập nhật trạng thái yêu cầu
    request.status = "APPROVED";
    request.approved_by = approverId;
    request.approved_at = new Date();
    request.processed_at = new Date();
    await request.save();

    return res.json({ success: true, data: request });
  } catch (err) {
    console.error("approveBorrowRequest error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

