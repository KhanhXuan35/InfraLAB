import Inventory from "../../models/Inventory.js";
import DeviceInstance from "../../models/DeviceInstance.js";
import RequestsWarehouse from "../../models/RequestsWarehouse.js";
import Device from "../../models/Device.js";
import User from "../../models/User.js";
import ActivityLogs from "../../models/ActivityLogs.js";
import Repair from "../../models/Repair.js";
import BorrowLab from "../../models/BorrowLab.js";

// Lấy thống kê highlights cho School Dashboard
export const getSchoolStats = async (req, res) => {
  try {
    // Lọc dữ liệu chỉ cho location = warehouse (theo yêu cầu school_admin)
    const warehouseInventories = await Inventory.find({
      location: "warehouse",
    }).lean();

    // 1. Tổng thiết bị = tổng trường "total" của tất cả inventory ở warehouse
    const totalDevices = warehouseInventories.reduce(
      (sum, inv) => sum + (inv.total || 0),
      0
    );

    // 2. Thiết bị đang hoạt động = tổng "available" ở warehouse
    const activeDevices = warehouseInventories.reduce(
      (sum, inv) => sum + (inv.available || 0),
      0
    );

    // 3. Yêu cầu chờ duyệt - Đếm repairs có status pending hoặc requests warehouse pending
    const pendingRepairs = await Repair.countDocuments({
      status: { $in: ['pending', 'waiting'] }
    });
    const pendingWarehouseRequests = await RequestsWarehouse.countDocuments({
      status: "pending",
    });
    const pendingRequests = pendingRepairs + pendingWarehouseRequests;

    // 4. Thiết bị hỏng/sửa - Tổng số broken trong inventories + repairs đang sửa
    let brokenDevices = warehouseInventories.reduce(
      (sum, inv) => sum + (inv.broken || 0),
      0
    );
    // Thêm số thiết bị đang trong quá trình sửa chữa
    const devicesInRepair = await Repair.countDocuments({
      status: { $in: ['in_progress', 'approved'] }
    });
    brokenDevices += devicesInRepair;

    res.json({
      success: true,
      data: {
        totalDevices,
        activeDevices,
        pendingRequests,
        brokenDevices,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

// Lấy danh sách yêu cầu từ giáo viên
export const getTeacherRequests = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || "pending"; // pending, approved, rejected

    const requests = await RequestsWarehouse.find({ status })
      .populate("lecturer_id", "name email")
      .populate("items.device_id", "name")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Format dữ liệu
    const formattedRequests = requests.map((req) => {
      // Lấy thiết bị đầu tiên trong items để hiển thị
      const firstItem = req.items[0];
      const deviceName = firstItem?.device_id?.name || "N/A";
      const quantity = firstItem?.quantity || 0;

      // Xác định status badge
      let badge = "status-pending";
      let statusText = "Chờ duyệt";
      if (req.status === "approved") {
        badge = "status-ready";
        statusText = "Sẵn sàng xuất";
      } else if (req.status === "rejected") {
        badge = "status-urgent";
        statusText = "Đã từ chối";
      }

      // Format due date (tạm thời dùng createdAt + 7 ngày)
      const dueDate = new Date(req.createdAt);
      dueDate.setDate(dueDate.getDate() + 7);
      const dueDateStr = `Trước ${dueDate.getDate()}/${dueDate.getMonth() + 1}`;

      return {
        id: `REQ-${req._id.toString().slice(-3)}`,
        teacher: req.lecturer_id?.name || "N/A",
        device: deviceName,
        department: "N/A", // Có thể thêm vào User model sau
        dueDate: dueDateStr,
        status: statusText,
        badge: badge,
        _id: req._id,
      };
    });

    res.json({
      success: true,
      data: formattedRequests,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Lấy thống kê kho warehouse
export const getWarehouseStats = async (req, res) => {
  try {
    const inventories = await Inventory.find({ location: "warehouse" }).lean();

    let readyToShip = 0;
    let underRepair = 0;
    let expectedIncoming = 0; // Tạm thời, có thể tính từ RequestsWarehouse approved

    inventories.forEach((inv) => {
      readyToShip += inv.available || 0;
    });

    // Đếm thiết bị đang sửa chữa (có thể từ Repair model)
    // Tạm thời dùng số cố định
    underRepair = 24;

    // Tính tỷ lệ sử dụng (available / total)
    let totalDevices = 0;
    inventories.forEach((inv) => {
      totalDevices += inv.total || 0;
    });
    const usageRate = totalDevices > 0 
      ? Math.round((readyToShip / totalDevices) * 100) 
      : 0;

    res.json({
      success: true,
      data: {
        readyToShip,
        underRepair,
        expectedIncoming,
        usageRate,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Lấy dữ liệu báo cáo chi tiết cho Reports Page
export const getReportsData = async (req, res) => {
  try {
    const { period = 'month' } = req.query; // month, quarter, year
    
    // Tính toán khoảng thời gian
    const now = new Date();
    let startDate = new Date();
    
  
    if (period === 'week') {
      startDate.setDate(now.getDate() - 7); // 1 tuần gần nhất
    } else 
    if (period === 'month') {
      startDate.setMonth(now.getMonth() - 6); // 6 tháng gần nhất
    } else if (period === 'quarter') {
      startDate.setMonth(now.getMonth() - 12); // 4 quý gần nhất
    } else {
      startDate.setFullYear(now.getFullYear() - 2); // 2 năm gần nhất
    }

    // 1. Thống kê thiết bị theo trạng thái từ cả Lab và Warehouse
    const deviceStatusFromInstances = await DeviceInstance.aggregate([
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
    
    deviceStatusFromInstances.forEach(item => {
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
    const repairStatusStats = {
      pending: await Repair.countDocuments({ status: 'pending' }),
      approved: await Repair.countDocuments({ status: 'approved' }),
      inProgress: await Repair.countDocuments({ status: 'in_progress' }),
      completed: await Repair.countDocuments({ status: 'done' }), // Sửa từ 'completed' thành 'done'
      rejected: await Repair.countDocuments({ status: 'rejected' }),
    };

    // 7. Tỷ lệ sử dụng thiết bị theo danh mục
    let categoryUsage = [];
    try {
      categoryUsage = await Inventory.aggregate([
        { $match: { location: 'warehouse' } },
        {
          $lookup: {
            from: 'devices',
            localField: 'device_id',
            foreignField: '_id',
            as: 'device'
          }
        },
        { $unwind: { path: '$device', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'categories',
            localField: 'device.category_id',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $ifNull: ['$category.name', 'Chưa phân loại'] },
            total: { $sum: '$total' },
            available: { $sum: '$available' },
            broken: { $sum: '$broken' }
          }
        },
        {
          $project: {
            categoryName: '$_id',
            total: 1,
            available: 1,
            broken: 1,
            usageRate: {
              $cond: [
                { $eq: ['$total', 0] },
                0,
                { $multiply: [{ $divide: ['$available', '$total'] }, 100] }
              ]
            }
          }
        },
        { $sort: { total: -1 } }
      ]);
    } catch (err) {
      // Error getting category usage
    }

    const responseData = {
      deviceStatusData,
      borrowRequestsByMonth,
      repairRequestsByMonth,
      topBorrowedDevices: topBorrowedDevices || [],
      borrowStatusStats,
      repairStatusStats,
      categoryUsage: categoryUsage || [],
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

