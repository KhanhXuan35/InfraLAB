import BorrowLab from "../../models/BorrowLab.js";
import DeviceInstance from "../../models/DeviceInstance.js";
import Inventory from "../../models/Inventory.js";
import Repair from "../../models/Repair.js";
import Notifications from "../../models/Notifications.js";
import ActivityLogs from "../../models/ActivityLogs.js";

// GET /api/lab-manager/borrow-requests/:id/return-info
export const getReturnInfo = async (req, res) => {
  try {
    const { id } = req.params;
    
    const borrowRequest = await BorrowLab.findById(id)
      .populate('student_id')
      .populate('items.device_id');
    
    if (!borrowRequest || borrowRequest.status !== "borrowed") {
      return res.status(400).json({
        success: false,
        message: "Đơn mượn không ở trạng thái đang mượn"
      });
    }
    
    // Lấy thông tin chi tiết từng thiết bị đang mượn
    const itemsWithInstances = [];
    
    for (const item of borrowRequest.items) {
      const instances = await DeviceInstance.find({
        _id: { $in: item.device_instances }
      }).lean();
      
      itemsWithInstances.push({
        device_model: {
          _id: item.device_id._id,
          name: item.device_id.name,
          image: item.device_id.image
        },
        instances: instances.map(inst => ({
          _id: inst._id,
          serial_number: inst.serial_number,
          condition_when_borrowed: inst.condition,
          storage_position_when_borrowed: inst.storage_position,
          borrowed_since: inst.current_holder?.since
        }))
      });
    }
    
    // Kiểm tra quá hạn
    const returnDueDate = new Date(borrowRequest.return_due_date);
    const today = new Date();
    const isOverdue = returnDueDate < today;
    const overdueDays = isOverdue 
      ? Math.ceil((today - returnDueDate) / (1000 * 60 * 60 * 24))
      : 0;
    
    res.json({
      success: true,
      data: {
        borrow_request: {
          _id: borrowRequest._id,
          student: {
            _id: borrowRequest.student_id._id,
            name: borrowRequest.student_id.name,
            email: borrowRequest.student_id.email,
            student_code: borrowRequest.student_id.student_code
          },
          borrowed_at: borrowRequest.createdAt,
          return_due_date: borrowRequest.return_due_date,
          purpose: borrowRequest.purpose,
          is_overdue: isOverdue,
          overdue_days: overdueDays
        },
        items: itemsWithInstances
      }
    });
    
  } catch (error) {
    console.error("Get return info error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/lab-manager/borrow-requests/:id/receive-return
export const receiveReturnDevices = async (req, res) => {
  try {
    const { id } = req.params;
    const { returns } = req.body;
    // returns = [
    //   {
    //     instance_id: "...",
    //     condition: "good",
    //     storage_position: "Tủ B - Ngăn 3",
    //     notes: "",
    //     images: []
    //   },
    //   {
    //     instance_id: "...",
    //     condition: "broken",
    //     broken_parts: ["Nút trái"],
    //     notes: "Nút trái bị hỏng",
    //     images: ["url1", "url2"],
    //     estimated_repair_cost: 50000
    //   }
    // ]
    
    const labManagerId = req.user._id;
    const borrowRequest = await BorrowLab.findById(id).populate('student_id');
    
    if (!borrowRequest || borrowRequest.status !== "borrowed") {
      return res.status(400).json({
        success: false,
        message: "Đơn mượn không hợp lệ"
      });
    }
    
    // ===== XỬ LÝ TỪNG THIẾT BỊ =====
    const goodDevices = [];
    const brokenDevices = [];
    const instanceIds = returns.map(r => r.instance_id);
    
    for (const returnInfo of returns) {
      const instance = await DeviceInstance.findById(returnInfo.instance_id);
      
      if (!instance || instance.current_holder?.borrow_id?.toString() !== id) {
        return res.status(400).json({
          success: false,
          message: `Thiết bị ${returnInfo.instance_id} không thuộc đơn mượn này`
        });
      }
      
      if (returnInfo.condition === "broken") {
        // ===== THIẾT BỊ HỎNG =====
        await DeviceInstance.findByIdAndUpdate(instance._id, {
          $set: {
            status: "broken",
            condition: "poor",
            location: "lab", // Đảm bảo location về lab
            current_holder: null
          }
        });
        
        // Tạo phiếu sửa chữa
        const repair = await Repair.create({
          device_instance_id: instance._id,
          device_id: instance.device_model_id,
          reported_by: borrowRequest.student_id._id,
          reason: returnInfo.notes || "Thiết bị hỏng khi trả",
          broken_parts: returnInfo.broken_parts || [],
          repair_type: "paid",  // Student phải trả phí
          status: "pending",
          images_before: returnInfo.images || [],
          compensation_required: true,
          estimated_repair_cost: returnInfo.estimated_repair_cost || 50000,
          image: returnInfo.images?.[0] || null
        });
        
        brokenDevices.push({ instance, repair });
        
        // Cập nhật inventory - Tính lại từ DeviceInstance để đảm bảo chính xác
        const inventory = await Inventory.findOne({
          device_id: instance.device_model_id,
          location: "lab"
        });
        
        // Tính lại số lượng thực tế từ DeviceInstance sau khi cập nhật
        const totalInLab = await DeviceInstance.countDocuments({
          device_model_id: instance.device_model_id,
          location: "lab"
        });
        
        const availableInLab = await DeviceInstance.countDocuments({
          device_model_id: instance.device_model_id,
          location: "lab",
          status: "available"
        });
        
        const borrowedInLab = await DeviceInstance.countDocuments({
          device_model_id: instance.device_model_id,
          location: "lab",
          status: "borrowed"
        });
        
        const brokenInLab = await DeviceInstance.countDocuments({
          device_model_id: instance.device_model_id,
          location: "lab",
          status: "broken"
        });
        
        if (inventory) {
          // Cập nhật bằng cách set trực tiếp từ DeviceInstance
          await Inventory.findByIdAndUpdate(inventory._id, {
            $set: {
              total: totalInLab,
              available: availableInLab,
              borrowed: borrowedInLab,
              broken: brokenInLab
            }
          });
        } else {
          // Nếu chưa có inventory record, tạo mới
          await Inventory.create({
            device_id: instance.device_model_id,
            location: "lab",
            total: totalInLab,
            available: availableInLab,
            borrowed: borrowedInLab,
            broken: brokenInLab
          });
        }
        
      } else {
        // ===== THIẾT BỊ TỐT =====
        await DeviceInstance.findByIdAndUpdate(instance._id, {
          $set: {
            status: "available",
            condition: returnInfo.condition,
            location: "lab", // Đảm bảo location về lab
            storage_position: returnInfo.storage_position || instance.storage_position,
            current_holder: null
          }
        });
        
        goodDevices.push(instance);
        
        // Cập nhật inventory - Tính lại từ DeviceInstance để đảm bảo chính xác
        const inventory = await Inventory.findOne({
          device_id: instance.device_model_id,
          location: "lab"
        });
        
        // Tính lại số lượng thực tế từ DeviceInstance sau khi cập nhật
        const totalInLab = await DeviceInstance.countDocuments({
          device_model_id: instance.device_model_id,
          location: "lab"
        });
        
        const availableInLab = await DeviceInstance.countDocuments({
          device_model_id: instance.device_model_id,
          location: "lab",
          status: "available"
        });
        
        const borrowedInLab = await DeviceInstance.countDocuments({
          device_model_id: instance.device_model_id,
          location: "lab",
          status: "borrowed"
        });
        
        const brokenInLab = await DeviceInstance.countDocuments({
          device_model_id: instance.device_model_id,
          location: "lab",
          status: "broken"
        });
        
        if (inventory) {
          // Cập nhật bằng cách set trực tiếp từ DeviceInstance
          await Inventory.findByIdAndUpdate(inventory._id, {
            $set: {
              total: totalInLab,
              available: availableInLab,
              borrowed: borrowedInLab,
              broken: brokenInLab
            }
          });
        } else {
          // Nếu chưa có inventory record, tạo mới
          await Inventory.create({
            device_id: instance.device_model_id,
            location: "lab",
            total: totalInLab,
            available: availableInLab,
            borrowed: borrowedInLab,
            broken: brokenInLab
          });
        }
      }
      
      // Log
      await ActivityLogs.create({
        user_id: labManagerId,
        action: "RECEIVE_RETURN",
        entity_type: "DeviceInstance",
        entity_id: instance._id,
        details: {
          borrow_id: borrowRequest._id,
          student_id: borrowRequest.student_id._id,
          condition: returnInfo.condition,
          notes: returnInfo.notes
        }
      });
    }
    
    // ===== CẬP NHẬT BORROW REQUEST =====
    if (brokenDevices.length > 0) {
      borrowRequest.status = "pending_compensation";
    } else {
      borrowRequest.status = "returned";
    }
    borrowRequest.returned = true;
    borrowRequest.returned_at = new Date();
    await borrowRequest.save();
    
    // ===== GỬI THÔNG BÁO =====
    if (brokenDevices.length > 0) {
      const totalCompensation = brokenDevices.reduce(
        (sum, item) => sum + item.repair.estimated_repair_cost,
        0
      );
      
      await Notifications.create({
        user_id: borrowRequest.student_id._id,
        type: "compensation_required",
        message: `Bạn có ${brokenDevices.length} thiết bị hỏng cần bồi thường. Tổng chi phí ước tính: ${totalCompensation.toLocaleString()}đ`,
        related_id: borrowRequest._id,
        related_type: "BorrowLab"
      });
    } else {
      await Notifications.create({
        user_id: borrowRequest.student_id._id,
        type: "return_completed",
        message: "Đã nhận trả thiết bị thành công. Cảm ơn bạn!",
        related_id: borrowRequest._id,
        related_type: "BorrowLab"
      });
    }
    
    res.json({
      success: true,
      message: "Đã nhận trả thiết bị",
      data: {
        borrow_request: borrowRequest,
        summary: {
          total: returns.length,
          good_devices: goodDevices.length,
          broken_devices: brokenDevices.length,
          total_compensation: brokenDevices.reduce((sum, item) => sum + item.repair.estimated_repair_cost, 0)
        },
        repairs: brokenDevices.map(d => ({
          device_serial: d.instance.serial_number,
          repair_id: d.repair._id,
          estimated_cost: d.repair.estimated_repair_cost
        }))
      }
    });
    
  } catch (error) {
    console.error("Receive return error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/lab-manager/returns/active
export const getActiveReturns = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const borrows = await BorrowLab.find({
      status: { $in: ["borrowed", "return_pending", "return_requested"] }
    })
      .populate('student_id', 'name email student_code')
      .populate('items.device_id', 'name image')
      .sort({ return_due_date: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Check quá hạn
    const today = new Date();
    const borrowsWithStatus = borrows.map(borrow => {
      const returnDueDate = new Date(borrow.return_due_date);
      const isOverdue = returnDueDate < today;
      const overdueDays = isOverdue 
        ? Math.ceil((today - returnDueDate) / (1000 * 60 * 60 * 24))
        : 0;
      
      return {
        ...borrow.toObject(),
        is_overdue: isOverdue,
        overdue_days: overdueDays
      };
    });
    
    const total = await BorrowLab.countDocuments({
      status: { $in: ["borrowed", "return_pending", "return_requested"] }
    });
    
    res.json({
      success: true,
      data: borrowsWithStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

