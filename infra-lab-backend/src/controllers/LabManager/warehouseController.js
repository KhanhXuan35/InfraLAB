import RequestLab from "../../models/requestlab.js";
import DeviceInstance from "../../models/DeviceInstance.js";
import Inventory from "../../models/Inventory.js";
import Notifications from "../../models/Notifications.js";
import ActivityLogs from "../../models/ActivityLogs.js";
import User from "../../models/User.js";

// GET /api/lab-manager/warehouse-requests/:id/available-devices
export const getAvailableDevicesForRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await RequestLab.findById(id)
      .populate('device_id', 'name image description');
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy yêu cầu"
      });
    }
    
    if (request.status !== "APPROVED") {
      return res.status(400).json({
        success: false,
        message: "Yêu cầu chưa được phê duyệt"
      });
    }
    
    // Lấy tất cả thiết bị available trong kho
    const availableInstances = await DeviceInstance.find({
      device_model_id: request.device_id,
      location: "warehouse",
      status: "available"
    }).lean();
    
    if (availableInstances.length < request.qty) {
      return res.status(400).json({
        success: false,
        message: `Kho chỉ còn ${availableInstances.length}/${request.qty} thiết bị`
      });
    }
    
    // Tính điểm và gợi ý
    const scoredInstances = availableInstances.map(instance => {
      const score = calculateDeviceScore(instance);
      return {
        ...instance,
        score,
        device_model_name: request.device_id.name,
        device_model_image: request.device_id.image
      };
    });
    
    // Sắp xếp theo điểm
    scoredInstances.sort((a, b) => b.score - a.score);
    
    // Đánh dấu top N là "suggested"
    const suggested = scoredInstances.slice(0, request.qty);
    suggested.forEach(item => item.suggested = true);
    
    res.json({
      success: true,
      data: {
        request_info: {
          _id: request._id,
          device_name: request.device_id.name,
          device_image: request.device_id.image,
          quantity: request.qty,
          reason: request.reason
        },
        available_instances: scoredInstances,
        suggested_instance_ids: suggested.map(i => i._id.toString()),
        total_available: scoredInstances.length
      }
    });
    
  } catch (error) {
    console.error("Get available devices error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/lab-manager/warehouse-requests/:id/confirm-receive
export const confirmReceiveDevices = async (req, res) => {
  try {
    const { id } = req.params;
    const { selected_instance_ids, lab_storage_position } = req.body;
    const labManagerId = req.user._id;
    
    const request = await RequestLab.findById(id).populate('device_id');
    
    if (!request || request.status !== "APPROVED") {
      return res.status(400).json({
        success: false,
        message: "Yêu cầu không hợp lệ"
      });
    }
    
    // Validate số lượng
    if (selected_instance_ids.length !== request.qty) {
      return res.status(400).json({
        success: false,
        message: `Cần chọn đúng ${request.qty} thiết bị`
      });
    }
    
    // Validate tất cả thiết bị hợp lệ
    const instances = await DeviceInstance.find({
      _id: { $in: selected_instance_ids },
      device_model_id: request.device_id,
      location: "warehouse",
      status: "available"
    });
    
    if (instances.length !== selected_instance_ids.length) {
      return res.status(400).json({
        success: false,
        message: "Có thiết bị không hợp lệ hoặc không có trong kho"
      });
    }
    
    // ===== CHUYỂN THIẾT BỊ TỪ WAREHOUSE → LAB =====
    await DeviceInstance.updateMany(
      { _id: { $in: selected_instance_ids } },
      {
        $set: {
          location: "lab",
          storage_position: lab_storage_position || "Chưa xác định"
        }
      }
    );
    
    // ===== CẬP NHẬT INVENTORY =====
    // Giảm warehouse
    await Inventory.findOneAndUpdate(
      { device_id: request.device_id, location: "warehouse" },
      {
        $inc: {
          total: -request.qty,
          available: -request.qty
        }
      }
    );
    
    // Tăng lab
    await Inventory.findOneAndUpdate(
      { device_id: request.device_id, location: "lab" },
      {
        $inc: {
          total: request.qty,
          available: request.qty
        }
      },
      { upsert: true }
    );
    
    // ===== CẬP NHẬT REQUEST =====
    request.status = "COMPLETED";
    request.received_at = new Date();
    request.received_by = labManagerId;
    request.received_instances = selected_instance_ids;
    await request.save();
    
    // ===== LOG =====
    await ActivityLogs.create({
      user_id: labManagerId,
      action: "RECEIVE_FROM_WAREHOUSE",
      entity_type: "RequestLab",
      entity_id: request._id,
      details: {
        device_model_id: request.device_id._id,
        device_name: request.device_id.name,
        quantity: request.qty,
        serial_numbers: instances.map(i => i.serial_number)
      }
    });
    
    res.json({
      success: true,
      message: `Đã nhận ${request.qty} thiết bị từ kho về Lab`,
      data: {
        request,
        instances: instances.map(i => ({
          _id: i._id,
          serial_number: i.serial_number,
          condition: i.condition
        }))
      }
    });
    
  } catch (error) {
    console.error("Confirm receive error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper function
function calculateDeviceScore(instance) {
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
}

