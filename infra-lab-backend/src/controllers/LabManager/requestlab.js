import RequestLab from "../../models/requestlab.js";
import Inventory from "../../models/Inventory.js";
import Device from "../../models/Device.js";

// Tạo yêu cầu mượn từ lab manager
export const createRequest = async (req, res) => {
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
    console.error("createRequest error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// School admin xem danh sách yêu cầu
export const listRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== "all") {
      filter.status = status.toUpperCase();
    }

    const requests = await RequestLab.find(filter)
      .populate({ path: "device_id", select: "name image category_id" })
      .populate({ path: "created_by", select: "name email role" })
      .populate({ path: "approved_by", select: "name email role" })
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: requests });
  } catch (err) {
    console.error("listRequests error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// School admin duyệt yêu cầu
export const approveRequest = async (req, res) => {
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

    const invWarehouse = await Inventory.findOne({
      device_id: request.device_id,
      location: "warehouse",
    });
    if (!invWarehouse || (invWarehouse.available || 0) < request.qty) {
      return res.status(400).json({ success: false, message: "Kho school không đủ số lượng" });
    }

    // Trừ kho school
    invWarehouse.available -= request.qty;
    invWarehouse.total = Math.max((invWarehouse.total || 0) - request.qty, 0);
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

    request.status = "APPROVED";
    request.approved_by = approverId;
    request.approved_at = new Date();
    request.processed_at = new Date();
    await request.save();

    return res.json({ success: true, data: request });
  } catch (err) {
    console.error("approveRequest error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// School admin từ chối
export const rejectRequest = async (req, res) => {
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

    request.status = "REJECTED";
    request.approved_by = approverId;
    request.approved_at = new Date();
    request.processed_at = new Date();
    await request.save();

    return res.json({ success: true, data: request });
  } catch (err) {
    console.error("rejectRequest error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
