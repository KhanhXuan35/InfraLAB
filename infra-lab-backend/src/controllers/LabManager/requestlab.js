import RequestLab from "../../models/requestlab.js";
import Inventory from "../../models/Inventory.js";
import Device from "../../models/Device.js";
import DeviceInstance from "../../models/DeviceInstance.js";
import Certificate from "../../models/Certificate.js";
import User from "../../models/User.js";

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
    const { status, requester_role, exclude_new_devices } = req.query;
    const filter = {};
    if (status && status !== "all") {
      filter.status = status.toUpperCase();
    }

    // Nếu có requester_role, cần populate created_by trước để filter
    // Tìm tất cả user có role tương ứng
    if (requester_role) {
      const usersWithRole = await User.find({ role: requester_role }).select("_id");
      const userIds = usersWithRole.map(u => u._id);
      filter.created_by = { $in: userIds };
    }

    let requests = await RequestLab.find(filter)
      .populate({ path: "device_id", select: "name image category_id verify" })
      .populate({ path: "created_by", select: "name email role" })
      .populate({ path: "approved_by", select: "name email role" })
      .populate({ path: "device_instance_ids", select: "serial_number status condition" })
      .sort({ createdAt: -1 });

    // Nếu exclude_new_devices = true, chỉ lấy các yêu cầu mượn thiết bị có sẵn (device.verify = true)
    // Loại bỏ yêu cầu thiết bị ngoài (device.verify = false)
    if (exclude_new_devices === "true" || exclude_new_devices === true) {
      requests = requests.filter(req => req.device_id?.verify === true);
    }

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

    // Tìm các device instances có sẵn trong kho warehouse, sắp xếp theo serial_number tăng dần
    // CHỈ LẤY DANH SÁCH, CHƯA CHUYỂN LOCATION
    const availableInstances = await DeviceInstance.find({
      device_model_id: request.device_id,
      location: "warehouse",
      status: "available"
    })
      .sort({ serial_number: 1 }) // Sắp xếp theo serial_number tăng dần
      .limit(request.qty);

    if (availableInstances.length < request.qty) {
      return res.status(400).json({ 
        success: false, 
        message: `Kho school chỉ còn ${availableInstances.length} thiết bị có sẵn, không đủ ${request.qty} thiết bị` 
      });
    }

    // Lưu danh sách device instances đã được chọn (chưa chuyển location)
    const instanceIds = availableInstances.map(inst => inst._id);
    
    // CHỈ DUYỆT, CHƯA CHUYỂN LOCATION - sẽ chuyển khi xác nhận đã giao
    request.status = "APPROVED";
    request.approved_by = approverId;
    request.approved_at = new Date();
    request.processed_at = new Date();
    request.device_instance_ids = instanceIds; // Lưu danh sách serial đã chọn
    await request.save();

    // Tạo chứng nhận (Certificate)
    const approver = await User.findById(approverId);
    const requester = await User.findById(request.created_by);
    
    // Tạo mã chứng nhận unique
    const certificateCode = `CERT-${Date.now()}-${request._id.toString().slice(-6)}`;
    
    const certificate = await Certificate.create({
      request_id: request._id,
      device_id: request.device_id,
      qty: request.qty,
      requester_id: request.created_by,
      requester_name: requester?.name || requester?.email || "N/A",
      requester_email: requester?.email || "N/A",
      requester_role: "lab_manager",
      approver_id: approverId,
      approver_name: approver?.name || approver?.email || "N/A",
      status: "APPROVED",
      approved_at: new Date(),
      device_instance_ids: instanceIds,
      certificate_code: certificateCode,
      note: "Đơn mượn này được tạo bởi Lab Manager. Sau khi duyệt, Lab Manager cần mang đơn này đến nhận thiết bị.",
    });

    // Tạo thông báo cho Lab Manager
    try {
      const Notifications = (await import("../../models/Notifications.js")).default;
      await Notifications.create({
        user_id: request.created_by,
        type: "borrow_approved",
        message: `Yêu cầu mượn thiết bị "${device.name}" (${request.qty} cái) đã được duyệt. Vui lòng mang đơn đến nhận thiết bị.`,
        related_id: request._id,
        related_type: "RequestLab",
      });
    } catch (notifError) {
      console.error("Error creating notification:", notifError);
      // Không throw error, chỉ log
    }

    // Populate lại request với device_instance_ids để trả về đầy đủ thông tin
    const populatedRequest = await RequestLab.findById(request._id)
      .populate({ path: "device_id", select: "name image category_id" })
      .populate({ path: "created_by", select: "name email role" })
      .populate({ path: "approved_by", select: "name email role" })
      .populate({ path: "device_instance_ids", select: "serial_number status condition" });

    return res.json({ 
      success: true, 
      data: populatedRequest,
      certificate: certificate 
    });
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

    // Tạo chứng nhận từ chối
    const approver = await User.findById(approverId);
    const requester = await User.findById(request.created_by);
    
    // Tạo mã chứng nhận unique
    const certificateCode = `CERT-${Date.now()}-${request._id.toString().slice(-6)}`;
    
    const certificate = await Certificate.create({
      request_id: request._id,
      device_id: request.device_id,
      qty: request.qty,
      requester_id: request.created_by,
      requester_name: requester?.name || requester?.email || "N/A",
      requester_email: requester?.email || "N/A",
      requester_role: "lab_manager",
      approver_id: approverId,
      approver_name: approver?.name || approver?.email || "N/A",
      status: "REJECTED",
      rejected_at: new Date(),
      certificate_code: certificateCode,
      note: req.body.reason || "Yêu cầu mượn thiết bị đã bị từ chối.",
    });

    // Tạo thông báo cho Lab Manager
    try {
      const Notifications = (await import("../../models/Notifications.js")).default;
      const device = await Device.findById(request.device_id);
      const rejectionReason = req.body.reason || "Không có lý do";
      await Notifications.create({
        user_id: request.created_by,
        type: "borrow_rejected",
        message: `Yêu cầu mượn thiết bị "${device?.name || 'N/A'}" (${request.qty} cái) đã bị từ chối. Lý do: ${rejectionReason}`,
        related_id: request._id,
        related_type: "RequestLab",
      });
    } catch (notifError) {
      console.error("Error creating notification:", notifError);
      // Không throw error, chỉ log
    }

    return res.json({ 
      success: true, 
      data: request,
      certificate: certificate 
    });
  } catch (err) {
    console.error("rejectRequest error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// School admin xác nhận "đã giao" - chuyển thiết bị sang Lab
export const deliverRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const approverId = req.user?._id;

    console.log(`[DELIVER] Processing deliver request for ID: ${id}`);

    const request = await RequestLab.findById(id)
      .populate({ path: "device_id", select: "name image" });

    if (!request) {
      return res.status(404).json({ success: false, message: "Không tìm thấy yêu cầu" });
    }
    if (request.status !== "APPROVED") {
      return res.status(400).json({ 
        success: false, 
        message: "Chỉ có thể xác nhận đã giao các yêu cầu đã được duyệt (APPROVED)" 
      });
    }

    if (!request.device_instance_ids || request.device_instance_ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Yêu cầu chưa có danh sách thiết bị được chọn" 
      });
    }

    // device_instance_ids là array of ObjectId, convert sang string để đảm bảo
    const instanceIds = request.device_instance_ids.map(inst => {
      if (typeof inst === 'object' && inst._id) {
        return inst._id.toString();
      }
      return inst.toString();
    });

    // Cập nhật các device instances: chuyển từ warehouse sang lab
    await DeviceInstance.updateMany(
      { _id: { $in: instanceIds } },
      {
        $set: {
          location: "lab",
          status: "available" // Thiết bị chuyển vào lab và sẵn sàng cho học sinh mượn
        }
      }
    );

    // Trừ kho school (giảm available, tăng borrowed, giữ nguyên total)
    const invWarehouse = await Inventory.findOne({
      device_id: request.device_id,
      location: "warehouse",
    });
    if (invWarehouse) {
      invWarehouse.available -= request.qty;
      invWarehouse.borrowed = (invWarehouse.borrowed || 0) + request.qty;
      await invWarehouse.save();
    }

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

    // Cập nhật status sang DELIVERED
    request.status = "DELIVERED";
    await request.save();

    // Cập nhật Certificate status sang DELIVERED
    const certificate = await Certificate.findOne({ request_id: request._id });
    if (certificate) {
      certificate.status = "DELIVERED";
      await certificate.save();
    }

    // Tạo thông báo cho Lab Manager
    try {
      const Notifications = (await import("../../models/Notifications.js")).default;
      await Notifications.create({
        user_id: request.created_by,
        type: "borrow_delivered",
        message: `Thiết bị "${request.device_id?.name || 'N/A'}" (${request.qty} cái) đã được giao đến phòng Lab. Bạn có thể sử dụng ngay.`,
        related_id: request._id,
        related_type: "RequestLab",
      });
    } catch (notifError) {
      console.error("Error creating notification:", notifError);
      // Không throw error, chỉ log
    }

    return res.json({ 
      success: true, 
      message: "Đã xác nhận giao thiết bị. Thiết bị đã được chuyển sang phòng Lab.",
      data: request 
    });
  } catch (err) {
    console.error("deliverRequest error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
