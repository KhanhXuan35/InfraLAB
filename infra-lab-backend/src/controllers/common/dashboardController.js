import DeviceInstance from "../../models/DeviceInstance.js";
import BorrowLab from "../../models/BorrowLab.js";
import Repair from "../../models/Repair.js";
import Device from "../../models/Device.js";
import User from "../../models/User.js";

// GET /api/dashboard/overview
export const getDashboardOverview = async (req, res) => {
  try {
    const userRole = req.user.role;
    
    // ===== THỐNG KÊ THIẾT BỊ =====
    const deviceStats = await DeviceInstance.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    const devicesByCondition = await DeviceInstance.aggregate([
      {
        $group: {
          _id: "$condition",
          count: { $sum: 1 }
        }
      }
    ]);
    
    const devicesByLocation = await DeviceInstance.aggregate([
      {
        $group: {
          _id: "$location",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // ===== THỐNG KÊ MƯỢN TRẢ =====
    const borrowStats = {
      pending: await BorrowLab.countDocuments({ status: "pending" }),
      borrowed: await BorrowLab.countDocuments({ status: "borrowed" }),
      overdue: await BorrowLab.countDocuments({
        status: "borrowed",
        return_due_date: { $lt: new Date() }
      }),
      pending_compensation: await BorrowLab.countDocuments({ status: "pending_compensation" })
    };
    
    // ===== THỐNG KÊ SỬA CHỮA =====
    const repairStats = await Repair.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          total_cost: { $sum: "$actual_repair_cost" }
        }
      }
    ]);
    
    // ===== GIÁ TRỊ THIẾT BỊ =====
    const totalValue = await DeviceInstance.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$purchase_price" }
        }
      }
    ]);
    
    const brokenDevicesValue = await DeviceInstance.aggregate([
      {
        $match: { status: "broken" }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$purchase_price" }
        }
      }
    ]);
    
    // ===== THIẾT BỊ SẮP HẾT BẢO HÀNH =====
    const warrantyExpiringSoon = await DeviceInstance.countDocuments({
      warranty_until: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 ngày
      }
    });
    
    // ===== THIẾT BỊ HAY HỎNG NHẤT =====
    const mostProblematicDevices = await DeviceInstance.find()
      .sort({ "usage_stats.total_repair_times": -1 })
      .limit(5)
      .populate('device_model_id', 'name image')
      .select('serial_number device_model_id usage_stats.total_repair_times usage_stats.total_repair_cost');
    
    // ===== SINH VIÊN HAY MẤT THIẾT BỊ =====
    const studentCompensations = await BorrowLab.aggregate([
      {
        $match: { status: "pending_compensation" }
      },
      {
        $group: {
          _id: "$student_id",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "student"
        }
      },
      {
        $unwind: "$student"
      }
    ]);
    
    res.json({
      success: true,
      data: {
        devices: {
          by_status: deviceStats,
          by_condition: devicesByCondition,
          by_location: devicesByLocation,
          total_count: await DeviceInstance.countDocuments(),
          warranty_expiring_soon: warrantyExpiringSoon
        },
        borrows: borrowStats,
        repairs: repairStats,
        financial: {
          total_asset_value: totalValue[0]?.total || 0,
          broken_devices_value: brokenDevicesValue[0]?.total || 0,
          total_repair_cost: repairStats.reduce((sum, r) => sum + (r.total_cost || 0), 0)
        },
        insights: {
          most_problematic_devices: mostProblematicDevices,
          students_with_compensations: studentCompensations
        }
      }
    });
    
  } catch (error) {
    console.error("Dashboard overview error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/dashboard/charts/borrow-trends
export const getBorrowTrends = async (req, res) => {
  try {
    const { months = 6 } = req.query;
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));
    
    const trends = await BorrowLab.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          total_requests: { $sum: 1 },
          approved: {
            $sum: {
              $cond: [{ $in: ["$status", ["borrowed", "returned"]] }, 1, 0]
            }
          },
          rejected: {
            $sum: {
              $cond: [{ $eq: ["$status", "rejected"] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);
    
    res.json({
      success: true,
      data: trends
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/dashboard/charts/device-utilization
export const getDeviceUtilization = async (req, res) => {
  try {
    const utilization = await Device.aggregate([
      {
        $lookup: {
          from: "deviceinstances",
          localField: "_id",
          foreignField: "device_model_id",
          as: "instances"
        }
      },
      {
        $project: {
          name: 1,
          total_instances: { $size: "$instances" },
          borrowed: {
            $size: {
              $filter: {
                input: "$instances",
                as: "inst",
                cond: { $eq: ["$$inst.status", "borrowed"] }
              }
            }
          },
          available: {
            $size: {
              $filter: {
                input: "$instances",
                as: "inst",
                cond: { $eq: ["$$inst.status", "available"] }
              }
            }
          },
          broken: {
            $size: {
              $filter: {
                input: "$instances",
                as: "inst",
                cond: { $eq: ["$$inst.status", "broken"] }
              }
            }
          }
        }
      },
      {
        $addFields: {
          utilization_rate: {
            $cond: [
              { $gt: ["$total_instances", 0] },
              { $multiply: [{ $divide: ["$borrowed", "$total_instances"] }, 100] },
              0
            ]
          }
        }
      },
      {
        $sort: { utilization_rate: -1 }
      }
    ]);
    
    res.json({
      success: true,
      data: utilization
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/dashboard/charts/repair-costs
export const getRepairCosts = async (req, res) => {
  try {
    const { months = 12 } = req.query;
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));
    
    const repairCosts = await Repair.aggregate([
      {
        $match: {
          completed_at: { $gte: startDate },
          status: "done"
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$completed_at" },
            month: { $month: "$completed_at" }
          },
          total_repairs: { $sum: 1 },
          total_cost: { $sum: "$actual_repair_cost" },
          warranty_repairs: {
            $sum: {
              $cond: [{ $eq: ["$repair_type", "warranty"] }, 1, 0]
            }
          },
          paid_repairs: {
            $sum: {
              $cond: [{ $eq: ["$repair_type", "paid"] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);
    
    res.json({
      success: true,
      data: repairCosts
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/dashboard/alerts
export const getDashboardAlerts = async (req, res) => {
  try {
    const alerts = [];
    
    // 1. Đơn mượn quá hạn
    const overdueCount = await BorrowLab.countDocuments({
      status: "borrowed",
      return_due_date: { $lt: new Date() }
    });
    
    if (overdueCount > 0) {
      alerts.push({
        type: "danger",
        title: "Đơn mượn quá hạn",
        message: `Có ${overdueCount} đơn mượn đã quá hạn trả`,
        count: overdueCount,
        action_url: "/lab-manager/borrows/overdue"
      });
    }
    
    // 2. Đơn mượn chờ duyệt
    const pendingCount = await BorrowLab.countDocuments({ status: "pending" });
    if (pendingCount > 0) {
      alerts.push({
        type: "warning",
        title: "Đơn mượn chờ duyệt",
        message: `Có ${pendingCount} đơn mượn đang chờ phê duyệt`,
        count: pendingCount,
        action_url: "/lab-manager/borrows/pending"
      });
    }
    
    // 3. Thiết bị sắp hết bảo hành
    const warrantyExpiringCount = await DeviceInstance.countDocuments({
      warranty_until: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
    
    if (warrantyExpiringCount > 0) {
      alerts.push({
        type: "info",
        title: "Bảo hành sắp hết",
        message: `Có ${warrantyExpiringCount} thiết bị sắp hết bảo hành trong 30 ngày`,
        count: warrantyExpiringCount,
        action_url: "/devices/warranty-expiring"
      });
    }
    
    // 4. Thiết bị hỏng chờ sửa
    const brokenCount = await DeviceInstance.countDocuments({ status: "broken" });
    if (brokenCount > 0) {
      alerts.push({
        type: "warning",
        title: "Thiết bị hỏng",
        message: `Có ${brokenCount} thiết bị đang hỏng`,
        count: brokenCount,
        action_url: "/devices/broken"
      });
    }
    
    // 5. Chờ bồi thường
    const compensationCount = await BorrowLab.countDocuments({ status: "pending_compensation" });
    if (compensationCount > 0) {
      alerts.push({
        type: "warning",
        title: "Chờ bồi thường",
        message: `Có ${compensationCount} đơn chờ sinh viên bồi thường`,
        count: compensationCount,
        action_url: "/lab-manager/compensations"
      });
    }
    
    res.json({
      success: true,
      data: {
        alerts,
        total_alerts: alerts.length
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

