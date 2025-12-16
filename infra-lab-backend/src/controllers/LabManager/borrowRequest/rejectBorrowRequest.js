import RequestLab from "../../../models/requestlab.js";

/**
 * School Admin từ chối yêu cầu mượn thiết bị
 * PATCH /api/request-lab/:id/reject
 */
export const rejectBorrowRequest = async (req, res) => {
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
    console.error("rejectBorrowRequest error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

