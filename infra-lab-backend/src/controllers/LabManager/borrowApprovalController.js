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
// Luồng mới: nếu không truyền selected_devices, hệ thống sẽ tự chọn
// các instance available theo serial_number tăng dần cho từng thiết bị.
export const approveAndAssignDevices = async (req, res) => {
  try {
    const { id } = req.params;
    let { selected_devices } = req.body || {};
    // selected_devices (nếu truyền tay):
    // {
    //   "device_model_id_1": ["instance_id_1", "instance_id_2"],
    //   "device_model_id_2": ["instance_id_3"]
    // }

    const labManagerId = req.user._id;
    const borrowRequest = await BorrowLab.findById(id)
      .populate("student_id")
      .populate("items.device_id");

    if (!borrowRequest || borrowRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Đơn mượn không hợp lệ",
      });
    }

    // Kiểm tra xem có items không
    if (!borrowRequest.items || borrowRequest.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Đơn mượn không có thiết bị nào",
      });
    }

    // ===== TỰ ĐỘNG CHỌN THIẾT BỊ THEO SERIAL TĂNG DẦN (NẾU KHÔNG GỬI selected_devices) =====
    if (!selected_devices || Object.keys(selected_devices).length === 0) {
      selected_devices = {};

      for (const item of borrowRequest.items) {
        // Xử lý device_id có thể là ObjectId hoặc đã được populate
        const deviceModelIdObj = item.device_id._id || item.device_id;
        const deviceModelId = deviceModelIdObj.toString();
        const deviceName = item.device_id?.name || deviceModelId;

        // Debug: Kiểm tra tổng số thiết bị của model này
        const totalInstances = await DeviceInstance.countDocuments({
          device_model_id: deviceModelIdObj,
        });
        
        // Debug: Kiểm tra số lượng theo location
        const instancesInLab = await DeviceInstance.countDocuments({
          device_model_id: deviceModelIdObj,
          location: "lab",
        });
        
        const instancesInWarehouse = await DeviceInstance.countDocuments({
          device_model_id: deviceModelIdObj,
          location: "warehouse",
        });
        
        // Debug: Kiểm tra số lượng theo status
        const instancesAvailable = await DeviceInstance.countDocuments({
          device_model_id: deviceModelIdObj,
          status: "available",
        });
        
        // Debug: Kiểm tra số lượng available trong lab
        const instancesAvailableInLab = await DeviceInstance.countDocuments({
          device_model_id: deviceModelIdObj,
          location: "lab",
          status: "available",
        });
        
        // Debug: Kiểm tra số lượng theo status trong lab
        const instancesInLabByStatus = await DeviceInstance.aggregate([
          {
            $match: {
              device_model_id: deviceModelIdObj,
              location: "lab",
            },
          },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ]);
        
        // Debug: Kiểm tra số lượng available trong warehouse
        const instancesAvailableInWarehouse = await DeviceInstance.countDocuments({
          device_model_id: deviceModelIdObj,
          location: "warehouse",
          status: "available",
        });
        
        console.log(`[DEBUG] Device Model: ${deviceName} (${deviceModelId})`);
        console.log(`  - Tổng số thiết bị: ${totalInstances}`);
        console.log(`  - Trong lab: ${instancesInLab}`);
        console.log(`  - Trong warehouse: ${instancesInWarehouse}`);
        console.log(`  - Available (tất cả location): ${instancesAvailable}`);
        console.log(`  - Available trong lab: ${instancesAvailableInLab}`);
        console.log(`  - Available trong warehouse: ${instancesAvailableInWarehouse}`);
        console.log(`  - Trạng thái trong lab:`, instancesInLabByStatus);
        console.log(`  - Cần: ${item.quantity}`);

        // Lấy đủ số lượng instance available, location = lab, sort theo serial_number tăng dần
        let instancesForItem = await DeviceInstance.find({
          device_model_id: deviceModelIdObj,
          location: "lab",
          status: "available",
        })
          .sort({ serial_number: 1 })
          .limit(item.quantity)
          .select("_id serial_number status location");

        // Nếu không đủ trong lab, tự động chuyển từ warehouse về lab
        if (instancesForItem.length < item.quantity) {
          const needed = item.quantity - instancesForItem.length;
          
          // Kiểm tra xem có đủ trong warehouse không
          if (instancesAvailableInWarehouse >= needed) {
            console.log(`[AUTO-TRANSFER] Chuyển ${needed} thiết bị từ warehouse về lab cho "${deviceName}"`);
            
            // Lấy thiết bị từ warehouse
            const instancesFromWarehouse = await DeviceInstance.find({
              device_model_id: deviceModelIdObj,
              location: "warehouse",
              status: "available",
            })
              .sort({ serial_number: 1 })
              .limit(needed)
              .select("_id serial_number");
            
            // Chuyển về lab
            await DeviceInstance.updateMany(
              { _id: { $in: instancesFromWarehouse.map(i => i._id) } },
              { $set: { location: "lab" } }
            );
            
            // Cập nhật Inventory - Giảm từ warehouse
            const warehouseInventory = await Inventory.findOneAndUpdate(
              { device_id: deviceModelIdObj, location: "warehouse" },
              { $inc: { available: -needed } },
              { new: true }
            );
            
            // Cập nhật Inventory - Tăng vào lab
            const labInventory = await Inventory.findOne({ 
              device_id: deviceModelIdObj, 
              location: "lab" 
            });
            
            if (labInventory) {
              // Tính lại total và available từ DeviceInstance sau khi chuyển
              const labTotalAfter = await DeviceInstance.countDocuments({
                device_model_id: deviceModelIdObj,
                location: "lab",
              });
              
              const labAvailableAfter = await DeviceInstance.countDocuments({
                device_model_id: deviceModelIdObj,
                location: "lab",
                status: "available",
              });
              
              const labBrokenAfter = await DeviceInstance.countDocuments({
                device_model_id: deviceModelIdObj,
                location: "lab",
                status: "broken",
              });
              
              await Inventory.findOneAndUpdate(
                { device_id: deviceModelIdObj, location: "lab" },
                { 
                  $set: { 
                    total: labTotalAfter,
                    available: labAvailableAfter,
                    broken: labBrokenAfter,
                  } 
                }
              );
            } else {
              // Tạo mới nếu chưa có - tính lại sau khi chuyển
              const labTotalAfter = await DeviceInstance.countDocuments({
                device_model_id: deviceModelIdObj,
                location: "lab",
              });
              
              const labAvailableAfter = await DeviceInstance.countDocuments({
                device_model_id: deviceModelIdObj,
                location: "lab",
                status: "available",
              });
              
              const labBrokenAfter = await DeviceInstance.countDocuments({
                device_model_id: deviceModelIdObj,
                location: "lab",
                status: "broken",
              });
              
              await Inventory.create({
                device_id: deviceModelIdObj,
                location: "lab",
                total: labTotalAfter,
                available: labAvailableAfter,
                broken: labBrokenAfter,
              });
            }
            
            // Lấy lại danh sách sau khi chuyển
            instancesForItem = await DeviceInstance.find({
              device_model_id: deviceModelIdObj,
              location: "lab",
              status: "available",
            })
              .sort({ serial_number: 1 })
              .limit(item.quantity)
              .select("_id serial_number status location");
            
            console.log(`[AUTO-TRANSFER] Đã chuyển ${instancesFromWarehouse.length} thiết bị. Tổng available trong lab: ${instancesForItem.length}`);
          }
        }

        if (instancesForItem.length < item.quantity) {
          // Kiểm tra Inventory để xem số lượng available
          const inventory = await Inventory.findOne({
            device_id: deviceModelIdObj,
            location: "lab",
          });
          
          const inventoryAvailable = inventory?.available || 0;
          
          // Tạo thông báo chi tiết về trạng thái các thiết bị trong lab
          const statusBreakdown = instancesInLabByStatus
            .map(s => `${s._id}: ${s.count}`)
            .join(", ");
          
          // Kiểm tra xem có thiết bị trong warehouse không
          let suggestion = "";
          if (instancesAvailableInWarehouse >= item.quantity) {
            suggestion = ` Có ${instancesAvailableInWarehouse} thiết bị available trong warehouse. Cần chuyển về lab trước khi phê duyệt.`;
          }
          
          // Kiểm tra xem có thiết bị trong lab nhưng không available không
          let statusSuggestion = "";
          if (instancesInLab > 0 && instancesAvailableInLab === 0) {
            statusSuggestion = ` Có ${instancesInLab} thiết bị trong lab nhưng không có thiết bị nào ở trạng thái "available". Trạng thái hiện tại: ${statusBreakdown || "không có"}.`;
          }
          
          // Kiểm tra xem Inventory và DeviceInstance có đồng bộ không
          let syncWarning = "";
          if (inventoryAvailable > instancesAvailableInLab) {
            syncWarning = ` ⚠️ Cảnh báo: Inventory báo có ${inventoryAvailable} available nhưng DeviceInstance chỉ có ${instancesAvailableInLab} available. Có thể cần đồng bộ lại Inventory.`;
          }
          
          return res.status(400).json({
            success: false,
            message: `Không đủ thiết bị có sẵn cho "${deviceName}". Cần ${item.quantity}, chỉ còn ${instancesForItem.length} available trong lab. (Inventory báo: ${inventoryAvailable} available).${statusSuggestion}${syncWarning}${suggestion}`,
            debug: {
              device_model_id: deviceModelId,
              device_name: deviceName,
              required: item.quantity,
              available_in_lab: instancesForItem.length,
              total_in_lab: instancesInLab,
              status_breakdown_in_lab: instancesInLabByStatus,
              available_in_warehouse: instancesAvailableInWarehouse,
              available_all_locations: instancesAvailable,
              inventory_available: inventoryAvailable,
              inventory_sync_issue: inventoryAvailable !== instancesAvailableInLab,
            },
          });
        }

        selected_devices[deviceModelId] = instancesForItem.map((inst) =>
          inst._id.toString()
        );
      }
    }

    // ===== VALIDATE SỐ LƯỢNG THEO selected_devices (tự sinh hoặc truyền từ FE) =====
    for (const item of borrowRequest.items) {
      const deviceModelIdObj = item.device_id._id || item.device_id;
      const deviceModelId = deviceModelIdObj.toString();
      const selected = selected_devices[deviceModelId] || [];
      if (selected.length !== item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Cần chọn đúng ${item.quantity} thiết bị cho mỗi loại`,
        });
      }
    }

    const allInstanceIds = Object.values(selected_devices).flat();

    // Validate tất cả instances hợp lệ và đang available tại lab
    const instances = await DeviceInstance.find({
      _id: { $in: allInstanceIds },
      location: "lab",
      status: "available",
    });

    if (instances.length !== allInstanceIds.length) {
      return res.status(400).json({
        success: false,
        message: "Có thiết bị không hợp lệ hoặc không còn available",
      });
    }

    // ===== CẬP NHẬT DEVICE INSTANCES =====
    // Set toàn bộ current_holder object để tránh lỗi khi current_holder là null
    await DeviceInstance.updateMany(
      { _id: { $in: allInstanceIds } },
      {
        $set: {
          status: "borrowed",
          current_holder: {
            user_id: borrowRequest.student_id._id,
            borrow_id: borrowRequest._id,
            since: new Date(),
          },
          "usage_stats.last_borrowed_at": new Date(),
          "usage_stats.last_borrowed_by": borrowRequest.student_id._id,
        },
        $inc: { "usage_stats.total_borrows": 1 },
      }
    );

    // ===== CẬP NHẬT BORROW REQUEST =====
    for (const item of borrowRequest.items) {
      const deviceModelIdObj = item.device_id._id || item.device_id;
      const deviceModelId = deviceModelIdObj.toString();
      item.device_instances = selected_devices[deviceModelId].map(
        (iid) => new mongoose.Types.ObjectId(iid)
      );
    }

    borrowRequest.status = "borrowed";
    borrowRequest.approved_by = labManagerId;
    borrowRequest.approved_at = new Date();
    await borrowRequest.save();

    // ===== CẬP NHẬT INVENTORY =====
    for (const item of borrowRequest.items) {
      const deviceModelIdObj = item.device_id._id || item.device_id;
      await Inventory.findOneAndUpdate(
        { device_id: deviceModelIdObj, location: "lab" },
        {
          $inc: {
            available: -item.quantity,
            borrowed: item.quantity,
          },
        }
      );
    }

    // ===== GỬI THÔNG BÁO =====
    await Notifications.create({
      user_id: borrowRequest.student_id._id,
      type: "borrow_approved",
      message:
        "Đơn mượn thiết bị đã được phê duyệt. Vui lòng đến Lab nhận thiết bị.",
      related_id: borrowRequest._id,
      related_type: "BorrowLab",
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
          return_due_date: borrowRequest.return_due_date,
        },
      });
    }

    res.json({
      success: true,
      message: "Đã phê duyệt và phân bổ thiết bị thành công",
      data: {
        borrow_request: borrowRequest,
        assigned_instances: instances.map((i) => ({
          _id: i._id,
          serial_number: i.serial_number,
          device_model_id: i.device_model_id,
        })),
      },
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
    
    // Chỉ lấy các yêu cầu có status = "pending" (chờ Lab Manager duyệt)
    const requests = await BorrowLab.find({ status: "pending" })
      .populate({
        path: 'student_id',
        select: 'name email student_code phone avatar',
        strictPopulate: false,
      })
      .populate({
        path: 'items.device_id',
        select: 'name image description category_id',
        strictPopulate: false,
        populate: {
          path: 'category_id',
          select: 'name',
          strictPopulate: false,
        },
      })
      .populate({
        path: 'items.device_instances',
        select: 'serial_number status condition',
        strictPopulate: false,
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await BorrowLab.countDocuments({ status: "pending" });
    
    console.log(`[getPendingBorrowRequests] Found ${total} pending borrow requests`);
    
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
    console.error("[getPendingBorrowRequests] Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

