import DeviceInstance from "../../models/DeviceInstance.js";
import ActivityLogs from "../../models/ActivityLogs.js";
import BorrowLab from "../../models/BorrowLab.js";
import Repair from "../../models/Repair.js";

// GET /api/device-instances/:id/history
export const getDeviceInstanceHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const instance = await DeviceInstance.findById(id)
      .populate('device_model_id', 'name image category_id')
      .populate('current_holder.user_id', 'name email student_code')
      .populate('current_holder.borrow_id');
    
    if (!instance) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thiết bị"
      });
    }
    
    // Lấy activity logs
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const activities = await ActivityLogs.find({
      entity_type: "DeviceInstance",
      entity_id: id
    })
      .populate('user_id', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalActivities = await ActivityLogs.countDocuments({
      entity_type: "DeviceInstance",
      entity_id: id
    });
    
    // Lấy lịch sử mượn
    const borrowHistory = await BorrowLab.find({
      "items.device_instances": id
    })
      .populate('student_id', 'name email student_code')
      .populate('approved_by', 'name')
      .select('student_id status createdAt return_due_date returned_at approved_by')
      .sort({ createdAt: -1 });
    
    // Lấy lịch sử sửa chữa
    const repairHistory = await Repair.find({
      device_instance_id: id
    })
      .populate('reported_by', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: {
        instance: {
          _id: instance._id,
          serial_number: instance.serial_number,
          device_model: instance.device_model_id,
          status: instance.status,
          condition: instance.condition,
          location: instance.location,
          storage_position: instance.storage_position,
          purchase_date: instance.purchase_date,
          purchase_price: instance.purchase_price,
          warranty_until: instance.warranty_until,
          usage_stats: instance.usage_stats,
          current_holder: instance.current_holder
        },
        activities: activities,
        borrow_history: borrowHistory,
        repair_history: repairHistory,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalActivities,
          totalPages: Math.ceil(totalActivities / parseInt(limit))
        }
      }
    });
    
  } catch (error) {
    console.error("Get history error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/device-instances/:id/summary
export const getDeviceInstanceSummary = async (req, res) => {
  try {
    const { id } = req.params;
    
    const instance = await DeviceInstance.findById(id)
      .populate('device_model_id', 'name image')
      .populate('current_holder.user_id', 'name email student_code');
    
    if (!instance) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thiết bị"
      });
    }
    
    // Tính toán thống kê
    const totalBorrows = instance.usage_stats?.total_borrows || 0;
    const totalRepairs = instance.usage_stats?.total_repair_times || 0;
    const totalRepairCost = instance.usage_stats?.total_repair_cost || 0;
    
    const isWarrantyValid = instance.warranty_until && new Date() < new Date(instance.warranty_until);
    
    const score = instance.calculateScore();
    
    // Tính tuổi thiết bị (ngày)
    const ageInDays = Math.floor((Date.now() - new Date(instance.purchase_date)) / (1000 * 60 * 60 * 24));
    
    // Tính tần suất mượn (lần/tháng)
    const ageInMonths = Math.max(1, ageInDays / 30);
    const borrowFrequency = (totalBorrows / ageInMonths).toFixed(2);
    
    res.json({
      success: true,
      data: {
        instance: {
          _id: instance._id,
          serial_number: instance.serial_number,
          device_model: instance.device_model_id,
          status: instance.status,
          condition: instance.condition,
          location: instance.location,
          current_holder: instance.current_holder
        },
        statistics: {
          total_borrows: totalBorrows,
          total_repairs: totalRepairs,
          total_repair_cost: totalRepairCost,
          age_in_days: ageInDays,
          borrow_frequency_per_month: parseFloat(borrowFrequency),
          is_warranty_valid: isWarrantyValid,
          warranty_days_left: isWarrantyValid 
            ? Math.ceil((new Date(instance.warranty_until) - Date.now()) / (1000 * 60 * 60 * 24))
            : 0,
          priority_score: score
        },
        recommendations: generateRecommendations(instance, totalBorrows, totalRepairs, ageInDays)
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: Tạo khuyến nghị
function generateRecommendations(instance, totalBorrows, totalRepairs, ageInDays) {
  const recommendations = [];
  
  if (instance.condition === "poor") {
    recommendations.push({
      type: "warning",
      message: "Thiết bị ở tình trạng kém, cân nhắc thanh lý hoặc nâng cấp"
    });
  }
  
  if (totalRepairs > 3) {
    recommendations.push({
      type: "warning",
      message: `Đã sửa ${totalRepairs} lần, chi phí cao. Nên cân nhắc thay thế.`
    });
  }
  
  if (instance.warranty_until) {
    const daysLeft = Math.ceil((new Date(instance.warranty_until) - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft > 0 && daysLeft < 30) {
      recommendations.push({
        type: "info",
        message: `Bảo hành sắp hết (còn ${daysLeft} ngày). Nên kiểm tra kỹ trước khi hết hạn.`
      });
    }
  }
  
  if (totalBorrows > 50) {
    recommendations.push({
      type: "info",
      message: `Đã mượn ${totalBorrows} lần. Thiết bị được sử dụng nhiều, cần kiểm tra định kỳ.`
    });
  }
  
  if (instance.usage_stats?.last_borrowed_at) {
    const daysSince = (Date.now() - new Date(instance.usage_stats.last_borrowed_at)) / (1000 * 60 * 60 * 24);
    if (daysSince > 180) {
      recommendations.push({
        type: "info",
        message: `Không được mượn trong ${Math.floor(daysSince)} ngày. Nên kiểm tra hoạt động.`
      });
    }
  }
  
  if (ageInDays > 1095) { // 3 năm
    recommendations.push({
      type: "warning",
      message: `Thiết bị đã ${Math.floor(ageInDays / 365)} năm tuổi. Cân nhắc nâng cấp.`
    });
  }
  
  if (recommendations.length === 0) {
    recommendations.push({
      type: "success",
      message: "Thiết bị hoạt động tốt, không có vấn đề đáng chú ý."
    });
  }
  
  return recommendations;
}

// GET /api/device-models/:modelId/instances-comparison
export const compareModelInstances = async (req, res) => {
  try {
    const { modelId } = req.params;
    
    const instances = await DeviceInstance.find({
      device_model_id: modelId
    }).lean();
    
    if (instances.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thiết bị nào"
      });
    }
    
    // So sánh các instance
    const comparison = instances.map(inst => ({
      serial_number: inst.serial_number,
      status: inst.status,
      condition: inst.condition,
      total_borrows: inst.usage_stats?.total_borrows || 0,
      total_repairs: inst.usage_stats?.total_repair_times || 0,
      total_repair_cost: inst.usage_stats?.total_repair_cost || 0,
      last_borrowed_at: inst.usage_stats?.last_borrowed_at,
      age_in_days: Math.floor((Date.now() - new Date(inst.purchase_date)) / (1000 * 60 * 60 * 24))
    }));
    
    // Tìm thiết bị hay hỏng nhất
    const mostProblematic = [...comparison].sort((a, b) => b.total_repairs - a.total_repairs)[0];
    
    // Tìm thiết bị được dùng nhiều nhất
    const mostUsed = [...comparison].sort((a, b) => b.total_borrows - a.total_borrows)[0];
    
    // Tính trung bình
    const avgBorrows = comparison.reduce((sum, i) => sum + i.total_borrows, 0) / comparison.length;
    const avgRepairs = comparison.reduce((sum, i) => sum + i.total_repairs, 0) / comparison.length;
    
    res.json({
      success: true,
      data: {
        instances: comparison,
        insights: {
          total_instances: instances.length,
          most_problematic: {
            serial_number: mostProblematic.serial_number,
            total_repairs: mostProblematic.total_repairs,
            total_repair_cost: mostProblematic.total_repair_cost
          },
          most_used: {
            serial_number: mostUsed.serial_number,
            total_borrows: mostUsed.total_borrows
          },
          averages: {
            borrows: avgBorrows.toFixed(2),
            repairs: avgRepairs.toFixed(2)
          }
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

