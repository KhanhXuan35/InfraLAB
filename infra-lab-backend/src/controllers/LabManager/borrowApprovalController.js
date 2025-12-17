import BorrowLab from "../../models/BorrowLab.js";
import DeviceInstance from "../../models/DeviceInstance.js";
import Device from "../../models/Device.js";
import Inventory from "../../models/Inventory.js";
import Notifications from "../../models/Notifications.js";
import ActivityLogs from "../../models/ActivityLogs.js";
import mongoose from "mongoose";

// Helper: Tính điểm thiết bị
const calculateDeviceScore = (instance) => {
  let score = 100;
  
  const conditionScores = { new: 30, good: 20, fair: 10, poor: 0 };
  score += conditionScores[instance.condition] || 0;
  
  score -= (instance.usage_stats?.total_borrows || 0) * 2;
  score -= (instance.usage_stats?.total_repair_times || 0) * 10;
  
  if (instance.usage_stats?.last_borrowed_at) {
    const daysSince = (Date.now() - new Date(instance.usage_stats.last_borrowed_at)) / (1000 * 60 * 60 * 24);
    if (daysSince > 30) score += 15;
    if (daysSince > 60) score += 25;
  } else {
    score += 10;
  }
  
  if (instance.warranty_until) {
    const daysUntilExpiry = (new Date(instance.warranty_until) - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysUntilExpiry > 0 && daysUntilExpiry < 90) {
      score += 10;
    }
  }
  
  return Math.max(0, Math.min(100, score));
};

// GET /api/lab-manager/borrow-requests/:id/available-devices
export const getAvailableDevicesForBorrow = async (req, res) => {
  try {
    const { id } = req.params;
    
    const borrowRequest = await BorrowLab.findById(id)
      .populate('student_id')
      .populate('items.device_id');
    
    if (!borrowRequest) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn mượn"
      });
    }
    
    if (borrowRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Đơn mượn không ở trạng thái chờ duyệt"
      });
    }
    
    // ===== LẤY THIẾT BỊ AVAILABLE VÀ GỢI Ý CHO TỪNG LOẠI =====
    const itemsWithDevices = [];
    
    for (const item of borrowRequest.items) {
      // Lấy tất cả available
      const availableInstances = await DeviceInstance.find({
        device_model_id: item.device_id,
        location: "lab",
        status: "available"
      }).lean();
      
      // Kiểm tra đủ không
      if (availableInstances.length < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `${item.device_id.name}: Lab chỉ còn ${availableInstances.length}/${item.quantity} thiết bị`
        });
      }
      
      // Tính điểm
      const scoredInstances = availableInstances.map(instance => ({
        ...instance,
        score: calculateDeviceScore(instance)
      }));
      
      // Sắp xếp
      scoredInstances.sort((a, b) => b.score - a.score);
      
      // Gợi ý top N
      const suggested = scoredInstances.slice(0, item.quantity);
      suggested.forEach(i => i.suggested = true);
      
      itemsWithDevices.push({
        device_model_id: item.device_id._id,
        device_model: {
          name: item.device_id.name,
          image: item.device_id.image,
          description: item.device_id.description
        },
        quantity: item.quantity,
        lab_available: availableInstances.length,
        available_instances: scoredInstances,
        suggested_instance_ids: suggested.map(i => i._id.toString())
      });
    }
    
    res.json({
      success: true,
      data: {
        borrow_request: {
          _id: borrowRequest._id,
          student: {
            _id: borrowRequest.student_id._id,
            name: borrowRequest.student_id.name,
            email: borrowRequest.student_id.email,
            student_code: borrowRequest.student_id.student_code,
            phone: borrowRequest.student_id.phone,
            avatar: borrowRequest.student_id.avatar
          },
          return_due_date: borrowRequest.return_due_date,
          purpose: borrowRequest.purpose,
          notes: borrowRequest.notes,
          createdAt: borrowRequest.createdAt
        },
        items: itemsWithDevices
      }
    });
    
  } catch (error) {
    console.error("Get available devices error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/lab-manager/borrow-requests/:id/approve-and-assign
export const approveAndAssignDevices = async (req, res) => {
  try {
    const { id } = req.params;
    const { selected_devices } = req.body;
    // selected_devices = {
    //   "device_model_id_1": ["instance_id_1", "instance_id_2"],
    //   "device_model_id_2": ["instance_id_3"]
    // }
    
    const labManagerId = req.user._id;
    const borrowRequest = await BorrowLab.findById(id).populate('student_id');
    
    if (!borrowRequest || borrowRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Đơn mượn không hợp lệ"
      });
    }
    
    // Validate số lượng
    for (const item of borrowRequest.items) {
      const selected = selected_devices[item.device_id.toString()] || [];
      if (selected.length !== item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Cần chọn đúng ${item.quantity} thiết bị cho mỗi loại`
        });
      }
    }
    
    const allInstanceIds = Object.values(selected_devices).flat();
    
    // Validate tất cả instances hợp lệ
    const instances = await DeviceInstance.find({
      _id: { $in: allInstanceIds },
      location: "lab",
      status: "available"
    });
    
    if (instances.length !== allInstanceIds.length) {
      return res.status(400).json({
        success: false,
        message: "Có thiết bị không hợp lệ hoặc không còn available"
      });
    }
    
    // ===== CẬP NHẬT DEVICE INSTANCES =====
    await DeviceInstance.updateMany(
      { _id: { $in: allInstanceIds } },
      {
        $set: {
          status: "borrowed",
          "current_holder.user_id": borrowRequest.student_id._id,
          "current_holder.borrow_id": borrowRequest._id,
          "current_holder.since": new Date(),
          "usage_stats.last_borrowed_at": new Date(),
          "usage_stats.last_borrowed_by": borrowRequest.student_id._id
        },
        $inc: { "usage_stats.total_borrows": 1 }
      }
    );
    
    // ===== CẬP NHẬT BORROW REQUEST =====
    for (const item of borrowRequest.items) {
      const deviceModelId = item.device_id.toString();
      item.device_instances = selected_devices[deviceModelId].map(
        id => mongoose.Types.ObjectId(id)
      );
    }
    
    borrowRequest.status = "borrowed";
    borrowRequest.approved_by = labManagerId;
    borrowRequest.approved_at = new Date();
    await borrowRequest.save();
    
    // ===== CẬP NHẬT INVENTORY =====
    for (const item of borrowRequest.items) {
      await Inventory.findOneAndUpdate(
        { device_id: item.device_id, location: "lab" },
        {
          $inc: {
            available: -item.quantity,
            borrowed: item.quantity
          }
        }
      );
    }
    
    // ===== GỬI THÔNG BÁO =====
    await Notifications.create({
      user_id: borrowRequest.student_id._id,
      type: "borrow_approved",
      message: `Đơn mượn thiết bị đã được phê duyệt. Vui lòng đến Lab nhận thiết bị.`,
      related_id: borrowRequest._id,
      related_type: "BorrowLab"
    });
    
    // ===== LOG =====
    for (const instanceId of allInstanceIds) {
      await ActivityLogs.create({
        user_id: labManagerId,
        action: "HANDOVER_DEVICE",
        entity_type: "DeviceInstance",
        entity_id: instanceId,
        details: {
          borrow_id: borrowRequest._id,
          student_id: borrowRequest.student_id._id,
          student_name: borrowRequest.student_id.name,
          return_due_date: borrowRequest.return_due_date
        }
      });
    }
    
    res.json({
      success: true,
      message: "Đã phê duyệt và phân bổ thiết bị thành công",
      data: {
        borrow_request: borrowRequest,
        assigned_instances: instances.map(i => ({
          _id: i._id,
          serial_number: i.serial_number,
          device_model_id: i.device_model_id
        }))
      }
    });
    
  } catch (error) {
    console.error("Approve error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/lab-manager/borrow-requests/:id/reject
export const rejectBorrowRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const labManagerId = req.user._id;
    
    const borrowRequest = await BorrowLab.findById(id).populate('student_id');
    
    if (!borrowRequest || borrowRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Đơn mượn không hợp lệ"
      });
    }
    
    borrowRequest.status = "rejected";
    borrowRequest.approved_by = labManagerId;
    borrowRequest.approved_at = new Date();
    borrowRequest.rejected_reason = reason || "Không đủ điều kiện";
    await borrowRequest.save();
    
    // Gửi thông báo
    await Notifications.create({
      user_id: borrowRequest.student_id._id,
      type: "borrow_rejected",
      message: `Đơn mượn thiết bị bị từ chối. Lý do: ${reason || 'Không đủ điều kiện'}`,
      related_id: borrowRequest._id,
      related_type: "BorrowLab"
    });
    
    res.json({
      success: true,
      message: "Đã từ chối đơn mượn"
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/lab-manager/borrow-requests/pending
export const getPendingBorrowRequests = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const requests = await BorrowLab.find({ status: "pending" })
      .populate('student_id', 'name email student_code phone avatar')
      .populate('items.device_id', 'name image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await BorrowLab.countDocuments({ status: "pending" });
    
    res.json({
      success: true,
      data: requests,
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

