import mongoose from "mongoose";
import BorrowLab from "../../models/BorrowLab.js";
import Device from "../../models/Device.js";
import Inventory from "../../models/Inventory.js";
import User from "../../models/User.js";
import Notifications from "../../models/Notifications.js";

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

    // ===== KHÔNG TRỪ TỒN KHO NGAY =====
    // Chỉ tạo yêu cầu với status "pending"
    // Lab Manager sẽ phê duyệt và assign thiết bị cụ thể sau
    
    const borrow = await BorrowLab.create({
      student_id: studentId,
      items: items.map((i) => ({
        device_id: i.device_id,
        quantity: i.quantity,
        device_instances: []  // Chưa assign thiết bị cụ thể
      })),
      return_due_date: returnDate,
      purpose: purpose.trim(),
      notes: notes?.trim(),
      status: "pending",  // Chờ phê duyệt
      returned: false,
    });
    
    // Gửi thông báo cho Lab Manager
    const labManagers = await User.find({ role: "lab_manager" });
    
    for (const lm of labManagers) {
      await Notifications.create({
        user_id: lm._id,
        type: "new_borrow_request",
        message: `Sinh viên ${req.user.name || 'N/A'} yêu cầu mượn ${items.length} loại thiết bị`,
        related_id: borrow._id,
        related_type: "BorrowLab"
      });
    }

    res.status(201).json({
      success: true,
      message: "Đã gửi yêu cầu mượn. Vui lòng chờ Lab Manager phê duyệt.",
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
        strictPopulate: false, // Không throw error nếu không tìm thấy
      })
      .populate({
        path: "items.device_id",
        select: "name description image category_id",
        strictPopulate: false, // Không throw error nếu không tìm thấy
        populate: {
          path: "category_id",
          select: "name",
          strictPopulate: false,
        },
      })
      .populate({
        path: "items.device_instances",
        select: "serial_number status condition",
        strictPopulate: false,
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Đếm tổng số
    const total = await BorrowLab.countDocuments(query);

    // Format dữ liệu trả về
    const formattedBorrows = borrows
      .filter((borrow) => {
        // Lọc bỏ các borrow không có student_id hợp lệ
        if (!borrow.student_id || !borrow.student_id._id) {
          console.warn(`Borrow ${borrow._id} has invalid student_id`);
          return false;
        }
        return true;
      })
      .map((borrow) => {
        try {
          return {
            _id: borrow._id,
            student: {
              _id: borrow.student_id?._id || null,
              name: borrow.student_id?.name || "N/A",
              email: borrow.student_id?.email || "",
              student_code: borrow.student_id?.student_code || "",
              phone: borrow.student_id?.phone || "",
            },
            items: (borrow.items || [])
              .filter((item) => {
                // Lọc bỏ các item không có device_id hợp lệ
                if (!item || !item.device_id || !item.device_id._id) {
                  console.warn(`Borrow ${borrow._id} has invalid device_id in item`);
                  return false;
                }
                return true;
              })
              .map((item) => {
                try {
                  // Lấy danh sách serial numbers từ device_instances
                  const serialNumbers = (item.device_instances || [])
                    .map(inst => inst.serial_number || inst._id?.toString().slice(-8))
                    .filter(Boolean);
                  
                  return {
                    device: {
                      _id: item.device_id?._id || null,
                      name: item.device_id?.name || "N/A",
                      description: item.device_id?.description || "",
                      image: item.device_id?.image || "",
                      category: item.device_id?.category_id && item.device_id.category_id._id
                        ? {
                            _id: item.device_id.category_id._id,
                            name: item.device_id.category_id?.name || "N/A",
                          }
                        : null,
                    },
                    quantity: item.quantity || 0,
                    serialNumbers: serialNumbers, // Thêm serial numbers
                    device_instances: item.device_instances || [], // Giữ nguyên để frontend có thể dùng
                  };
                } catch (itemError) {
                  console.error(`Error processing item in borrow ${borrow._id}:`, itemError);
                  return null;
                }
              })
              .filter((item) => item !== null), // Lọc bỏ các item null
            return_due_date: borrow.return_due_date,
            purpose: borrow.purpose || "",
            notes: borrow.notes || "",
            status: borrow.status || "pending",
            rejected_reason: borrow.rejected_reason || null,
            returned: borrow.returned || false,
            createdAt: borrow.createdAt,
            updatedAt: borrow.updatedAt,
          };
        } catch (borrowError) {
          console.error(`Error processing borrow ${borrow._id}:`, borrowError);
          return null;
        }
      })
      .filter((borrow) => {
        // Lọc bỏ các borrow null và không có items hợp lệ
        return borrow !== null && borrow.items && borrow.items.length > 0;
      });

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

// Lấy lịch sử mượn của một thiết bị (chỉ của người khác)
export const getDeviceBorrowHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { deviceId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!deviceId || !mongoose.Types.ObjectId.isValid(deviceId)) {
      return res.status(400).json({ success: false, message: "deviceId không hợp lệ" });
    }

    // Tìm các đơn mượn có chứa device này và không phải của user hiện tại
    const borrows = await BorrowLab.find({
      "items.device_id": deviceId,
      student_id: { $ne: userId }, // Loại trừ đơn mượn của chính user
    })
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
      .lean();

    // Lọc chỉ lấy các item có device_id trùng với deviceId
    const formattedBorrows = borrows
      .map((borrow) => {
        const deviceItem = borrow.items.find(
          (item) => item.device_id._id.toString() === deviceId
        );
        if (!deviceItem) return null;

        return {
          _id: borrow._id,
          student: {
            _id: borrow.student_id._id,
            name: borrow.student_id.name,
            email: borrow.student_id.email,
            student_code: borrow.student_id.student_code,
            phone: borrow.student_id.phone,
          },
          device: {
            _id: deviceItem.device_id._id,
            name: deviceItem.device_id.name,
            description: deviceItem.device_id.description,
            image: deviceItem.device_id.image,
            category: deviceItem.device_id.category_id
              ? {
                  _id: deviceItem.device_id.category_id._id,
                  name: deviceItem.device_id.category_id.name,
                }
              : null,
          },
          quantity: deviceItem.quantity,
          return_due_date: borrow.return_due_date,
          purpose: borrow.purpose,
          notes: borrow.notes,
          status: borrow.status,
          returned: borrow.returned,
          createdAt: borrow.createdAt,
          updatedAt: borrow.updatedAt,
        };
      })
      .filter((item) => item !== null);

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    const paginatedBorrows = formattedBorrows.slice(skip, skip + limitNum);
    const total = formattedBorrows.length;

    res.status(200).json({
      success: true,
      data: paginatedBorrows,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("getDeviceBorrowHistory error:", error);
    res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

