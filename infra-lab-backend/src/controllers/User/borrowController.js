import mongoose from "mongoose";
import BorrowLab from "../../models/BorrowLab.js";
import Device from "../../models/Device.js";
import Inventory from "../../models/Inventory.js";

export const createBorrowRequest = async (req, res) => {
  try {
    const studentId = req.user?.id;
    const { items, return_due_date, purpose, notes } = req.body;

    if (!studentId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Danh sách thiết bị không hợp lệ" });
    }

    for (const item of items) {
      if (!item.device_id || !mongoose.Types.ObjectId.isValid(item.device_id)) {
        return res.status(400).json({ success: false, message: "device_id không hợp lệ" });
      }
      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({ success: false, message: "Số lượng phải lớn hơn 0" });
      }
    }

    if (!return_due_date) {
      return res.status(400).json({ success: false, message: "Vui lòng chọn ngày trả" });
    }
    const returnDate = new Date(return_due_date);
    if (Number.isNaN(returnDate.getTime())) {
      return res.status(400).json({ success: false, message: "Ngày trả không hợp lệ" });
    }
    if (!purpose || purpose.trim() === "") {
      return res.status(400).json({ success: false, message: "Vui lòng nhập mục đích sử dụng" });
    }

    // Kiểm tra tồn tại thiết bị & tồn kho
    const deviceIds = items.map((i) => i.device_id);
    const devices = await Device.find({ _id: { $in: deviceIds } });
    if (devices.length !== items.length) {
      return res.status(404).json({ success: false, message: "Có thiết bị không tồn tại" });
    }

    const inventories = await Inventory.find({
      device_id: { $in: deviceIds },
      location: "lab",
    }).lean();

    for (const item of items) {
      const dev = devices.find((d) => d._id.toString() === item.device_id);
      const inv = inventories.find((i) => i.device_id.toString() === item.device_id);
      if (!inv) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy tồn kho lab cho thiết bị ${dev?.name || item.device_id}`,
        });
      }
      const available = inv?.available ?? 0;
      if (item.quantity > available) {
        return res.status(400).json({
          success: false,
          message: `Số lượng mượn vượt quá số có sẵn cho thiết bị ${dev?.name || item.device_id}`,
        });
      }
    }

    // Trừ tồn kho lab ngay khi mượn
    for (const item of items) {
      const inv = inventories.find((i) => i.device_id.toString() === item.device_id);
      const newAvailable = (inv.available || 0) - item.quantity;
      const newTotal = (inv.total || 0) - item.quantity;
      if (newAvailable < 0 || newTotal < 0) {
        return res.status(400).json({
          success: false,
          message: "Tồn kho không đủ",
        });
      }
      await Inventory.findByIdAndUpdate(inv._id, {
        $set: { available: newAvailable, total: newTotal },
      });
    }

    const borrow = await BorrowLab.create({
      student_id: studentId,
      items: items.map((i) => ({
        device_id: i.device_id,
        quantity: i.quantity,
      })),
      return_due_date: returnDate,
      purpose: purpose.trim(),
      notes: notes?.trim(),
      status: "borrowed",
      returned: false,
    });

    res.status(201).json({
      success: true,
      message: "Gửi yêu cầu mượn thành công",
      data: borrow,
    });
  } catch (error) {
    console.error("createBorrowRequest error:", error);
    res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

// Lấy danh sách thiết bị đã mượn
export const getLoanDeviceList = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { status, page = 1, limit = 10 } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Xây dựng query
    const query = {};
    
    // Nếu là student, chỉ xem của mình
    if (userRole === "student") {
      query.student_id = userId;
    }
    // Nếu là lab_manager, xem tất cả
    // Nếu không có filter, để query rỗng để lab_manager xem tất cả

    // Filter theo status nếu có
    if (status) {
      query.status = status;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Lấy danh sách với populate thông tin device và student
    const borrows = await BorrowLab.find(query)
      .populate({
        path: "student_id",
        select: "name email student_code phone",
      })
      .populate({
        path: "items.device_id",
        select: "name description image category_id",
        populate: {
          path: "category_id",
          select: "name",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Đếm tổng số
    const total = await BorrowLab.countDocuments(query);

    // Format dữ liệu trả về
    const formattedBorrows = borrows.map((borrow) => ({
      _id: borrow._id,
      student: {
        _id: borrow.student_id._id,
        name: borrow.student_id.name,
        email: borrow.student_id.email,
        student_code: borrow.student_id.student_code,
        phone: borrow.student_id.phone,
      },
      items: borrow.items.map((item) => ({
        device: {
          _id: item.device_id._id,
          name: item.device_id.name,
          description: item.device_id.description,
          image: item.device_id.image,
          category: item.device_id.category_id
            ? {
                _id: item.device_id.category_id._id,
                name: item.device_id.category_id.name,
              }
            : null,
        },
        quantity: item.quantity,
      })),
      return_due_date: borrow.return_due_date,
      purpose: borrow.purpose,
      notes: borrow.notes,
      status: borrow.status,
      returned: borrow.returned,
      createdAt: borrow.createdAt,
      updatedAt: borrow.updatedAt,
    }));

    res.status(200).json({
      success: true,
      data: formattedBorrows,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("getLoanDeviceList error:", error);
    res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

