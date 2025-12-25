import DeviceInstance from "../../models/DeviceInstance.js";
import BorrowLab from "../../models/BorrowLab.js";
import ReturnLab from "../../models/ReturnLab.js";
import Repair from "../../models/Repair.js";
import User from "../../models/User.js";

/**
 * 1. Trạng thái thiết bị trong Lab
 */
export const deviceStatusLab = async (req, res) => {
  try {
    const data = await DeviceInstance.aggregate([
      { $match: { location: "lab" } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 2. Mượn – Trả theo tháng
 */
export const borrowReturnStats = async (req, res) => {
  try {
    const borrow = await BorrowLab.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          borrow: { $sum: 1 }
        }
      }
    ]);

    const returned = await ReturnLab.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          returned: { $sum: 1 }
        }
      }
    ]);

    // Merge theo tháng
    const map = {};
    borrow.forEach(b => {
      map[b._id] = { month: b._id, borrow: b.borrow, returned: 0 };
    });
    returned.forEach(r => {
      if (!map[r._id]) {
        map[r._id] = { month: r._id, borrow: 0, returned: r.returned };
      } else {
        map[r._id].returned = r.returned;
      }
    });

    res.json({ success: true, data: Object.values(map) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 3. Top thiết bị hỏng nhiều nhất
 */
export const topBrokenDevices = async (req, res) => {
  try {
    const data = await Repair.aggregate([
      {
        $group: {
          _id: "$device_id",
          totalRepairs: { $sum: 1 }
        }
      },
      { $sort: { totalRepairs: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "devices",
          localField: "_id",
          foreignField: "_id",
          as: "device"
        }
      },
      { $unwind: "$device" },
      {
        $project: {
          name: "$device.name",
          totalRepairs: 1
        }
      }
    ]);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 4. Trạng thái sửa chữa
 */
export const repairStatusStats = async (req, res) => {
  try {
    const data = await Repair.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 5. Lấy dữ liệu báo cáo tổng hợp cho Lab Manager
 */
export const getLabManagerReports = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Tính toán khoảng thời gian
    const now = new Date();
    let startDate = new Date();
    
    // Nếu muốn bật nhanh chế độ "1 tuần gần nhất", có thể dùng mẫu dưới (bỏ //):
    if (period === 'week') {
      startDate.setDate(now.getDate() - 7); // 1 tuần gần nhất
    } else 
    if (period === 'month') {
      startDate.setMonth(now.getMonth() - 6);
    } else if (period === 'quarter') {
      startDate.setMonth(now.getMonth() - 12);
    } else {
      startDate.setFullYear(now.getFullYear() - 2);
    }

    // 1. Thống kê thiết bị từ cả Lab và Warehouse
    const deviceStatusByLocation = await DeviceInstance.aggregate([
      { 
        $match: { 
          location: { $in: ["lab", "warehouse"] } 
        } 
      },
      {
        $group: {
          _id: {
            location: "$location",
            status: "$status"
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Tổng hợp theo location và status
    const deviceStatusDetail = {
      lab: {
        available: 0,
        borrowed: 0,
        broken: 0,
        inRepair: 0,
        total: 0
      },
      warehouse: {
        available: 0,
        borrowed: 0,
        broken: 0,
        inRepair: 0,
        total: 0
      }
    };
    
    deviceStatusByLocation.forEach(item => {
      const location = item._id.location;
      const status = item._id.status;
      const count = item.count;
      
      if (location === 'lab' || location === 'warehouse') {
        if (status === 'available') {
          deviceStatusDetail[location].available = count;
        } else if (status === 'borrowed') {
          deviceStatusDetail[location].borrowed = count;
        } else if (status === 'broken') {
          deviceStatusDetail[location].broken = count;
        } else if (status === 'repairing' || status === 'maintenance') {
          deviceStatusDetail[location].inRepair += count;
        }
        deviceStatusDetail[location].total += count;
      }
    });

    const deviceStatusData = {
      available: deviceStatusDetail.lab.available + deviceStatusDetail.warehouse.available,
      borrowed: deviceStatusDetail.lab.borrowed + deviceStatusDetail.warehouse.borrowed,
      broken: deviceStatusDetail.lab.broken + deviceStatusDetail.warehouse.broken,
      inRepair: deviceStatusDetail.lab.inRepair + deviceStatusDetail.warehouse.inRepair,
      detail: deviceStatusDetail
    };

    // 2. Yêu cầu mượn theo tháng (6 tháng gần nhất)
    const borrowRequestsByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      
      const count = await BorrowLab.countDocuments({
        createdAt: { $gte: monthStart, $lte: monthEnd }
      });
      
      borrowRequestsByMonth.push({
        month: `${monthStart.getMonth() + 1}/${monthStart.getFullYear()}`,
        count
      });
    }

    // 3. Yêu cầu sửa chữa theo tháng
    const repairRequestsByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      
      const count = await Repair.countDocuments({
        createdAt: { $gte: monthStart, $lte: monthEnd }
      });
      
      repairRequestsByMonth.push({
        month: `${monthStart.getMonth() + 1}/${monthStart.getFullYear()}`,
        count
      });
    }

    // 4. Top 10 thiết bị được mượn nhiều nhất
    let topBorrowedDevices = [];
    try {
      topBorrowedDevices = await BorrowLab.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.device_id',
            totalQuantity: { $sum: '$items.quantity' },
            borrowCount: { $sum: 1 }
          }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'devices',
            localField: '_id',
            foreignField: '_id',
            as: 'device'
          }
        },
        { $unwind: { path: '$device', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            deviceName: { $ifNull: ['$device.name', 'Thiết bị đã xóa'] },
            totalQuantity: 1,
            borrowCount: 1
          }
        }
      ]);
    } catch (err) {
      // Error getting top borrowed devices
    }

    // 5. Thống kê theo trạng thái yêu cầu mượn
    const borrowStatusStats = {
      pending: await BorrowLab.countDocuments({ status: 'pending' }),
      approved: await BorrowLab.countDocuments({ status: 'approved' }),
      borrowed: await BorrowLab.countDocuments({ status: 'borrowed' }),
      returned: await BorrowLab.countDocuments({ status: 'returned' }),
      rejected: await BorrowLab.countDocuments({ status: 'rejected' }),
    };

    // 6. Thống kê theo trạng thái sửa chữa
    const repairStatusStats = await Repair.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Chuyển đổi sang format dễ sử dụng
    const repairStatusData = {
      pending: 0,
      approved: 0,
      inProgress: 0,
      completed: 0,
      rejected: 0,
    };
    
    repairStatusStats.forEach(item => {
      if (item._id === 'pending') repairStatusData.pending = item.count;
      else if (item._id === 'approved') repairStatusData.approved = item.count;
      else if (item._id === 'in_progress') repairStatusData.inProgress = item.count;
      else if (item._id === 'done') repairStatusData.completed = item.count;
      else if (item._id === 'rejected') repairStatusData.rejected = item.count;
    });

    // 7. Top thiết bị hỏng nhiều nhất
    let topBrokenDevices = [];
    try {
      topBrokenDevices = await Repair.aggregate([
        {
          $group: {
            _id: "$device_id",
            totalRepairs: { $sum: 1 }
          }
        },
        { $sort: { totalRepairs: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "devices",
            localField: "_id",
            foreignField: "_id",
            as: "device"
          }
        },
        { $unwind: { path: "$device", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            deviceName: { $ifNull: ["$device.name", "Thiết bị đã xóa"] },
            totalRepairs: 1
          }
        }
      ]);
    } catch (err) {
      // Error getting top broken devices
    }

    // 8. Thống kê về sinh viên
    const [
      totalActiveStudents,
      studentsCurrentlyBorrowingIds,
      overdueBorrows,
      pendingStudents
    ] = await Promise.all([
      User.countDocuments({ 
        role: 'student', 
        isActive: true 
      }),
      BorrowLab.distinct('student_id', {
        status: { $in: ['borrowed', 'return_pending'] }
      }),
      BorrowLab.countDocuments({
        return_due_date: { $lt: new Date() },
        status: { $in: ['borrowed', 'return_pending'] }
      }),
      User.countDocuments({ 
        role: 'student', 
        isActive: false 
      }),
    ]);

    const studentStats = {
      totalActiveStudents,
      studentsCurrentlyBorrowing: studentsCurrentlyBorrowingIds.length,
      overdueBorrows,
      pendingStudents,
    };

    const responseData = {
      deviceStatusData,
      borrowRequestsByMonth,
      repairRequestsByMonth,
      topBorrowedDevices: topBorrowedDevices || [],
      borrowStatusStats,
      repairStatusStats: repairStatusData,
      topBrokenDevices: topBrokenDevices || [],
      studentStats,
    };
    
    res.json({
      success: true,
      data: responseData,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};