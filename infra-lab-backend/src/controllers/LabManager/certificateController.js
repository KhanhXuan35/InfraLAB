import Certificate from "../../models/Certificate.js";
import RequestLab from "../../models/requestlab.js";
import Device from "../../models/Device.js";
import DeviceInstance from "../../models/DeviceInstance.js";
import User from "../../models/User.js";

// GET /api/certificates - Lấy danh sách chứng nhận của Lab Manager
export const getCertificates = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const certificates = await Certificate.find({ requester_id: userId })
      .populate({ path: "device_id", select: "name image category_id" })
      .populate({ path: "requester_id", select: "name email" })
      .populate({ path: "approver_id", select: "name email" })
      .populate({ path: "device_instance_ids", select: "serial_number status condition" })
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: certificates });
  } catch (err) {
    console.error("getCertificates error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/certificates/:id - Xem chi tiết chứng nhận
export const getCertificateDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const certificate = await Certificate.findById(id)
      .populate({ path: "device_id", select: "name image category_id description" })
      .populate({ path: "requester_id", select: "name email student_code" })
      .populate({ path: "approver_id", select: "name email" })
      .populate({ path: "device_instance_ids", select: "serial_number status condition location purchase_date warranty_until" });

    if (!certificate) {
      return res.status(404).json({ success: false, message: "Không tìm thấy chứng nhận" });
    }

    // Kiểm tra quyền: chỉ Lab Manager tạo ra chứng nhận này mới được xem
    if (certificate.requester_id?._id?.toString() !== userId?.toString() && req.user?.role !== "school_admin") {
      return res.status(403).json({ success: false, message: "Không có quyền xem chứng nhận này" });
    }

    return res.json({ success: true, data: certificate });
  } catch (err) {
    console.error("getCertificateDetail error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/certificates/:id/confirm-receive - Lab Manager xác nhận đã nhận thiết bị (chuyển status sang LENT)
export const confirmReceive = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const certificate = await Certificate.findById(id)
      .populate({ path: "request_id" });

    if (!certificate) {
      return res.status(404).json({ success: false, message: "Không tìm thấy chứng nhận" });
    }

    // Kiểm tra quyền
    if (certificate.requester_id?.toString() !== userId?.toString()) {
      return res.status(403).json({ success: false, message: "Không có quyền xác nhận chứng nhận này" });
    }

    // Chỉ cho phép xác nhận nếu status là APPROVED
    if (certificate.status !== "APPROVED") {
      return res.status(400).json({ success: false, message: "Chứng nhận không ở trạng thái đã duyệt" });
    }

    const request = await RequestLab.findById(certificate.request_id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Không tìm thấy yêu cầu" });
    }

    // Cập nhật status request sang LENT
    request.status = "LENT";
    await request.save();

    return res.json({ 
      success: true, 
      message: "Đã xác nhận nhận thiết bị",
      data: request 
    });
  } catch (err) {
    console.error("confirmReceive error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

