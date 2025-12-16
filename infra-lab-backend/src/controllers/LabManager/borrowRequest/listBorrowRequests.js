import RequestLab from "../../../models/requestlab.js";

/**
 * School Admin xem danh sách yêu cầu mượn thiết bị
 * GET /api/request-lab?status=WAITING
 */
export const listBorrowRequests = async (req, res) => {
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
    console.error("listBorrowRequests error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

