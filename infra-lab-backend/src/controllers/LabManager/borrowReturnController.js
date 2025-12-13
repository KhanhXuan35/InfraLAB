import BorrowLab from "../../models/BorrowLab.js";
import User from "../../models/User.js";
import Device from "../../models/Device.js";
import Notifications from "../../models/Notifications.js";
import ReturnLab from "../../models/ReturnLab.js";
import Inventory from "../../models/Inventory.js";
import Repair from "../../models/Repair.js";

// Lấy danh sách tất cả yêu cầu mượn (không nhóm theo sinh viên)
export const getBorrowingStudents = async (req, res) => {
  try {
    // Lấy tất cả các yêu cầu mượn (bao gồm cả đã trả xong)
    const borrowRecords = await BorrowLab.find({
      status: { $in: ["borrowed", "return_pending", "return_requested", "returned"] },
    })
      .populate("student_id", "name email username student_code phone")
      .populate("items.device_id", "name image category")
      .sort({ createdAt: -1 })
      .lean();

    // Format dữ liệu: mỗi BorrowLab record là một dòng
    const borrowList = borrowRecords.map((record) => {
      const returnDueDate = new Date(record.return_due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      returnDueDate.setHours(0, 0, 0, 0);
      
      const isOverdue = returnDueDate < today;
      
      // Tính tổng số lượng thiết bị
      let totalQuantity = 0;
      const items = record.items.map((item) => {
        totalQuantity += item.quantity || 0;
        return {
          device: {
            _id: item.device_id._id,
            name: item.device_id?.name || "N/A",
            image: item.device_id?.image || "",
            category: item.device_id?.category || "",
          },
          quantity: item.quantity || 0,
        };
      });

      return {
        borrowId: record._id,
        borrowIdString: record._id.toString(),
        student: {
          _id: record.student_id._id,
          name: record.student_id.name || "Chưa có tên",
          email: record.student_id.email || "",
          username: record.student_id.username || "",
          student_code: record.student_id.student_code || "",
          phone: record.student_id.phone || "",
        },
        returnDueDate: record.return_due_date,
        purpose: record.purpose || "",
        notes: record.notes || "",
        status: record.status,
        borrowedAt: record.createdAt,
        isOverdue: isOverdue,
        returnRequested: record.return_requested || false,
        returnRequestedAt: record.return_requested_at || null,
        items: items,
        totalQuantity: totalQuantity,
      };
    });

    return res.status(200).json({
      success: true,
      data: borrowList,
      total: borrowList.length,
    });
  } catch (error) {
    console.error("getBorrowingStudents error:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách yêu cầu mượn",
      error: error.message,
    });
  }
};

// Yêu cầu trả thiết bị quá hạn
export const requestReturn = async (req, res) => {
  try {
    const { borrowId } = req.body;

    if (!borrowId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc",
      });
    }

    // Tìm record mượn
    const borrowRecord = await BorrowLab.findById(borrowId);
    
    if (!borrowRecord) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bản ghi mượn",
      });
    }

    // Kiểm tra xem có quá hạn không
    const returnDueDate = new Date(borrowRecord.return_due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    returnDueDate.setHours(0, 0, 0, 0);

    if (returnDueDate >= today) {
      return res.status(400).json({
        success: false,
        message: "Thiết bị chưa quá hạn, không thể yêu cầu trả",
      });
    }

    // Cập nhật trạng thái
    borrowRecord.return_requested = true;
    borrowRecord.return_requested_at = new Date();
    borrowRecord.status = "return_requested";

    await borrowRecord.save();

    // Tạo thông báo cho sinh viên
    try {
      await Notifications.create({
        user_id: borrowRecord.student_id,
        type: "return_request",
        message: `Bạn được yêu cầu trả lại thiết bị đã quá hạn. Vui lòng liên hệ phòng Lab để trả thiết bị.`,
      });
    } catch (notifError) {
      console.error("Error creating notification:", notifError);
      // Không throw error, chỉ log
    }

    return res.status(200).json({
      success: true,
      message: "Đã gửi yêu cầu trả thiết bị quá hạn cho sinh viên",
      data: borrowRecord,
    });
  } catch (error) {
    console.error("requestReturn error:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể yêu cầu trả thiết bị",
      error: error.message,
    });
  }
};

// Ghi nhận trả thiết bị
export const recordReturn = async (req, res) => {
  try {
    const { borrowId, deviceId, quantity, brokenQuantity = 0, brokenReason } = req.body;

    if (!borrowId || !deviceId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc",
      });
    }

    // Kiểm tra số lượng hỏng không được vượt quá số lượng trả
    if (brokenQuantity > quantity) {
      return res.status(400).json({
        success: false,
        message: "Số lượng hỏng không được vượt quá số lượng trả",
      });
    }

    // Tìm record mượn
    const borrowRecord = await BorrowLab.findById(borrowId).populate("student_id");
    
    if (!borrowRecord) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bản ghi mượn",
      });
    }

    // Tìm item trong record
    const itemIndex = borrowRecord.items.findIndex(
      (item) => item.device_id.toString() === deviceId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thiết bị trong bản ghi mượn",
      });
    }

    const item = borrowRecord.items[itemIndex];

    // Kiểm tra số lượng trả
    if (quantity > item.quantity) {
      return res.status(400).json({
        success: false,
        message: "Số lượng trả không được vượt quá số lượng mượn",
      });
    }

    // Kiểm tra nếu thiết bị quá hạn, phải đã được yêu cầu trả
    const returnDueDate = new Date(borrowRecord.return_due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    returnDueDate.setHours(0, 0, 0, 0);

    if (returnDueDate < today && !borrowRecord.return_requested) {
      return res.status(400).json({
        success: false,
        message: "Thiết bị quá hạn. Vui lòng yêu cầu trả trước khi ghi nhận trả.",
      });
    }

    // Tìm hoặc tạo ReturnLab record
    let returnRecord = await ReturnLab.findOne({ borrow_id: borrowId });
    
    if (!returnRecord) {
      returnRecord = new ReturnLab({
        borrow_id: borrowId,
        student_id: borrowRecord.student_id._id,
        items: [],
        status: "pending_check",
      });
    }

    // Thêm item vào ReturnLab
    const returnItemIndex = returnRecord.items.findIndex(
      (returnItem) => returnItem.device_id.toString() === deviceId
    );

    const returnItemData = {
      device_id: deviceId,
      quantity: quantity,
      broken: brokenQuantity || 0,
    };

    if (returnItemIndex === -1) {
      returnRecord.items.push(returnItemData);
    } else {
      returnRecord.items[returnItemIndex].quantity += quantity;
      returnRecord.items[returnItemIndex].broken += brokenQuantity || 0;
    }

    await returnRecord.save();

    // Cập nhật Inventory - CHỈ nhận thiết bị tốt
    const inventory = await Inventory.findOne({
      device_id: deviceId,
      location: "lab",
    });

    const goodQuantity = quantity - (brokenQuantity || 0);
    
    if (inventory && goodQuantity > 0) {
      // CHỈ tăng số lượng available (thiết bị trả về còn tốt)
      // total KHÔNG thay đổi - đây là tổng số thiết bị phòng lab sở hữu
      inventory.available = (inventory.available || 0) + goodQuantity;
      
      await inventory.save();
    }

    // Nếu có thiết bị hỏng, KHÔNG nhận vào lab, để sinh viên tự sửa
    if (brokenQuantity > 0) {
      // Lưu thông tin thiết bị hỏng vào repairing_items để sinh viên biết cần sửa
      if (!borrowRecord.repairing_items) {
        borrowRecord.repairing_items = [];
      }
      
      const repairingItemIndex = borrowRecord.repairing_items.findIndex(
        (repairItem) => repairItem.device_id.toString() === deviceId
      );
      
      const repairingItemData = {
        device_id: deviceId,
        quantity: brokenQuantity,
        broken_reason: brokenReason || `Thiết bị bị hỏng khi sinh viên ${borrowRecord.student_id.name || 'N/A'} trả lại`,
        reported_at: new Date(),
      };
      
      if (repairingItemIndex === -1) {
        borrowRecord.repairing_items.push(repairingItemData);
      } else {
        // Nếu đã có thiết bị này trong danh sách sửa, cộng dồn số lượng
        borrowRecord.repairing_items[repairingItemIndex].quantity += brokenQuantity;
      }
      
      // Tạo thông báo cho sinh viên về thiết bị hỏng cần sửa
      try {
        await Notifications.create({
          user_id: borrowRecord.student_id._id,
          type: "warning",
          message: `Bạn có ${brokenQuantity} thiết bị bị hỏng cần tự sửa chữa. Vui lòng sửa xong và trả lại phòng Lab.`,
        });
      } catch (notifError) {
        console.error("Error creating notification:", notifError);
      }
    }

    // Cập nhật số lượng trong BorrowLab
    // - Giảm số lượng thiết bị tốt đã trả (goodQuantity)
    // - Thiết bị hỏng (brokenQuantity) KHÔNG giảm item.quantity vì không được nhận
    //   Thiết bị hỏng vẫn được tính vào quantity cho đến khi sinh viên sửa xong và trả lại
    const originalQuantity = item.quantity;
    
    if (goodQuantity > 0) {
      item.quantity -= goodQuantity;
      
      // Đảm bảo quantity không âm
      if (item.quantity < 0) {
        item.quantity = 0;
      }

      // Nếu đã trả hết thiết bị tốt, xóa item khỏi danh sách
      if (item.quantity === 0) {
        borrowRecord.items.splice(itemIndex, 1);
      }
    }
    
    // Nếu chỉ có thiết bị hỏng (goodQuantity = 0), KHÔNG giảm item.quantity
    // Thiết bị hỏng sẽ được lưu vào repairing_items và vẫn tính vào item.quantity
    // Ví dụ: Mượn 100, trả 100 (0 tốt, 100 hỏng) → item.quantity vẫn = 100, repairing_items = 100

    // Nếu không còn item nào (đã trả hết thiết bị tốt), đánh dấu là đã trả xong
    // Thiết bị hỏng đang sửa sẽ được xử lý riêng khi sinh viên trả lại (không ảnh hưởng status)
    if (borrowRecord.items.length === 0) {
      borrowRecord.returned = true;
      borrowRecord.status = "returned";
      borrowRecord.return_requested = false;
      
      // Chỉ đánh dấu returnRecord là done nếu không còn thiết bị đang sửa
      if (!borrowRecord.repairing_items || borrowRecord.repairing_items.length === 0) {
        returnRecord.status = "done";
        returnRecord.processed_at = new Date();
        await returnRecord.save();
      }
    } else {
      // Nếu còn item, chuyển sang trạng thái return_pending
      borrowRecord.status = "return_pending";
    }

    await borrowRecord.save();

    let message = "Ghi nhận trả thiết bị thành công";
    if (brokenQuantity > 0) {
      message += `. Đã nhận ${goodQuantity} thiết bị tốt. ${brokenQuantity} thiết bị hỏng cần sinh viên tự sửa chữa và trả lại.`;
    }

    return res.status(200).json({
      success: true,
      message: message,
      data: {
        borrowRecord,
        returnRecord,
        goodQuantity: goodQuantity,
        brokenQuantity: brokenQuantity || 0,
        repairingItems: borrowRecord.repairing_items || [],
      },
    });
  } catch (error) {
    console.error("recordReturn error:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể ghi nhận trả thiết bị",
      error: error.message,
    });
  }
};

// Ghi nhận trả thiết bị đã sửa chữa (sinh viên trả lại sau khi sửa)
export const recordRepairedReturn = async (req, res) => {
  try {
    const { borrowId, deviceId, quantity } = req.body;

    if (!borrowId || !deviceId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc",
      });
    }

    // Tìm record mượn
    const borrowRecord = await BorrowLab.findById(borrowId).populate("student_id");
    
    if (!borrowRecord) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bản ghi mượn",
      });
    }

    // Tìm thiết bị trong repairing_items
    if (!borrowRecord.repairing_items || borrowRecord.repairing_items.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không có thiết bị nào đang sửa chữa",
      });
    }

    const repairingItemIndex = borrowRecord.repairing_items.findIndex(
      (item) => item.device_id.toString() === deviceId
    );

    if (repairingItemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thiết bị đang sửa chữa trong bản ghi",
      });
    }

    const repairingItem = borrowRecord.repairing_items[repairingItemIndex];

    // Kiểm tra số lượng trả
    if (quantity > repairingItem.quantity) {
      return res.status(400).json({
        success: false,
        message: "Số lượng trả không được vượt quá số lượng đang sửa chữa",
      });
    }

    // Tìm hoặc tạo ReturnLab record
    let returnRecord = await ReturnLab.findOne({ borrow_id: borrowId });
    
    if (!returnRecord) {
      returnRecord = new ReturnLab({
        borrow_id: borrowId,
        student_id: borrowRecord.student_id._id,
        items: [],
        status: "pending_check",
      });
    }

    // Thêm item đã sửa vào ReturnLab
    const returnItemIndex = returnRecord.items.findIndex(
      (returnItem) => returnItem.device_id.toString() === deviceId
    );

    const returnItemData = {
      device_id: deviceId,
      quantity: quantity,
      broken: 0, // Đã sửa xong nên broken = 0
    };

    if (returnItemIndex === -1) {
      returnRecord.items.push(returnItemData);
    } else {
      returnRecord.items[returnItemIndex].quantity += quantity;
    }

    await returnRecord.save();

    // Cập nhật Inventory - nhận thiết bị đã sửa vào available
    const inventory = await Inventory.findOne({
      device_id: deviceId,
      location: "lab",
    });

    if (inventory) {
      // Tăng số lượng available (thiết bị đã sửa xong)
      // total KHÔNG thay đổi - đây là tổng số thiết bị phòng lab sở hữu
      inventory.available = (inventory.available || 0) + quantity;
      
      await inventory.save();
    }

    // Giảm số lượng trong repairing_items
    repairingItem.quantity -= quantity;

    // Nếu đã trả hết thiết bị đang sửa, xóa khỏi danh sách
    if (repairingItem.quantity === 0) {
      borrowRecord.repairing_items.splice(repairingItemIndex, 1);
    }

    // Giảm số lượng trong BorrowLab.items (thiết bị hỏng đã sửa xong và trả lại)
    const itemIndex = borrowRecord.items.findIndex(
      (item) => item.device_id.toString() === deviceId
    );

    if (itemIndex !== -1) {
      const item = borrowRecord.items[itemIndex];
      item.quantity -= quantity;

      // Nếu đã trả hết, xóa item khỏi danh sách
      if (item.quantity === 0) {
        borrowRecord.items.splice(itemIndex, 1);
      }
    }

    // Kiểm tra xem còn thiết bị nào chưa trả không
    const hasRemainingItems = borrowRecord.items.length > 0;
    const hasRemainingRepairing = borrowRecord.repairing_items && borrowRecord.repairing_items.length > 0;

    if (!hasRemainingItems && !hasRemainingRepairing) {
      // Đã trả hết tất cả (cả tốt và đã sửa)
      borrowRecord.returned = true;
      borrowRecord.status = "returned";
      borrowRecord.return_requested = false;
      returnRecord.status = "done";
      returnRecord.processed_at = new Date();
      await returnRecord.save();
    } else {
      borrowRecord.status = "return_pending";
    }

    await borrowRecord.save();

    // Tạo thông báo cho sinh viên
    try {
      await Notifications.create({
        user_id: borrowRecord.student_id._id,
        type: "success",
        message: `Đã nhận ${quantity} thiết bị đã sửa chữa. Cảm ơn bạn đã hoàn tất việc sửa chữa.`,
      });
    } catch (notifError) {
      console.error("Error creating notification:", notifError);
    }

    return res.status(200).json({
      success: true,
      message: `Ghi nhận trả ${quantity} thiết bị đã sửa chữa thành công`,
      data: {
        borrowRecord,
        returnRecord,
        repairedQuantity: quantity,
      },
    });
  } catch (error) {
    console.error("recordRepairedReturn error:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể ghi nhận trả thiết bị đã sửa",
      error: error.message,
    });
  }
};

