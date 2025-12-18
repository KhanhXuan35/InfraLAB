import DeviceInstance from "../../models/DeviceInstance.js";
import BorrowLab from "../../models/BorrowLab.js";
import ReturnLab from "../../models/ReturnLab.js";
import Repair from "../../models/Repair.js";
import mongoose from "mongoose";

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
