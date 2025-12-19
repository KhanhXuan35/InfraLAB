// controllers/LabManager/repairController.js
import Repair from "../../models/Repair.js";
import Device from "../../models/Device.js";
import Inventory from "../../models/Inventory.js";
import DeviceInstance from "../../models/DeviceInstance.js";
import BorrowLab from "../../models/BorrowLab.js";
import Notifications from "../../models/Notifications.js";
import uploadBufferToCloud from "../../utils/uploadToCloud.js";

/**
 * POST /api/repairs
 * body: { device_id, reason, quantity }
 * Lab Manager tạo yêu cầu sửa chữa
 */
export const createRepairRequest = async (req, res) => {
  try {
    const { device_id, quantity, reason, inventory_id, device_instance_id, serial_number, symptom } = req.body;

    if (!device_id || !reason || !inventory_id) {
      return res.status(400).json({
        success: false,
        message: "device_id, inventory_id và reason là bắt buộc",
      });
    }



    // 1. Kiểm tra thiết bị tồn tại
    const device = await Device.findById(device_id);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found"
      });
    }

    // 2. ✅ KIỂM TRA DEVICE INSTANCE TRƯỚC
    let instance = null;
    if (device_instance_id) {
      instance = await DeviceInstance.findById(device_instance_id);

      if (!instance) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy mã thiết bị (serial)."
        });
      }

      if (instance.status === "borrowed") {
        return res.status(400).json({
          success: false,
          message: "Thiết bị đang được mượn, không thể tạo yêu cầu sửa chữa."
        });
      }

      if (["broken", "repairing", "maintenance"].includes(instance.status)) {
        return res.status(400).json({
          success: false,
          message: "Thiết bị đang trong trạng thái sửa chữa/bảo trì."
        });
      }
    }

    // 3. ✅ SAU ĐÓ MỚI CHECK TRÙNG REPAIR
    const existingFilter = {
      device_id,
      status: { $in: ["pending", "approved", "in_progress"] },
    };

    if (device_instance_id) {
      existingFilter.device_instance_id = device_instance_id;
    }

    const existingRepair = await Repair.findOne(existingFilter);
    if (existingRepair) {
      return res.status(400).json({
        success: false,
        message: "Thiết bị này đã có yêu cầu sửa chữa đang được xử lý."
      });
    }

    // 3. Kiểm tra số lượng available
    const inventory = await Inventory.findById(inventory_id);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found"
      });
    }

    const requestQuantity = parseInt(quantity) || 1;
    if (requestQuantity > inventory.available) {
      return res.status(400).json({
        success: false,
        message: `Không đủ thiết bị có sẵn. Chỉ còn ${inventory.available} thiết bị.`
      });
    }

    // 4. Upload ảnh nếu có
    let imageUrl = null;
    if (req.file) {
      console.log("Received file:", req.file);
      imageUrl = await uploadBufferToCloud(req.file.buffer, req.file.mimetype);
      console.log("Uploaded URL:", imageUrl);
    }

    // 5. Tạo yêu cầu sửa chữa
    const repair = await Repair.create({
      device_id,
      quantity: requestQuantity,
      reason,
      // Lưu thêm symptom nếu frontend gửi lên
      broken_parts: symptom ? [symptom] : [],
      image: imageUrl,
      status: "pending",
      inventory_id: inventory_id,
      device_instance_id: device_instance_id || null,
      serial_number: serial_number || null,
    });

    // 6. Cập nhật tồn kho & trạng thái instance
    await Inventory.findByIdAndUpdate(
      repair.inventory_id,
      {
        $inc: {
          broken: repair.quantity,
          available: -repair.quantity,
        },
      }
    );

    // Nếu có truyền device_instance_id thì set trạng thái instance sang "repairing"
    // Thiết bị đang được gửi về trường để sửa
    if (device_instance_id) {
      await DeviceInstance.findByIdAndUpdate(device_instance_id, {
        $set: {
          status: "repairing", // Đang sửa chữa tại trường
        },
        $inc: {
          "usage_stats.total_repair_times": 1,
        },
      });
      console.log(`[createRepairRequest] DeviceInstance ${device_instance_id} set to repairing status`);
    }

    res.status(201).json({ success: true, data: repair });
  } catch (err) {
    console.error("createRepairRequest error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/repairs
 * query: status (optional) -> ?status=pending
 * School Admin (hoặc Lab Manager) xem danh sách yêu cầu
 */
export const getRepairs = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (status && status !== "all") {
      filter.status = status;
    }

    const repairs = await Repair.find(filter)
      .populate({
        path: "device_id",
        select: "name image",
      })
      .populate({
        path: "device_instance_id",
        select: "serial_number status location condition",
        strictPopulate: false,
      })
      .populate({
        path: "reported_by",
        select: "name email",
        strictPopulate: false,
      })
      .select("device_id device_instance_id serial_number quantity reason image status reason_rejected createdAt reviewed_at completed_at reported_by repair_type")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: repairs });
  } catch (err) {
    console.error("getRepairs error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

/**
 * GET /api/repairs/:id
 * Lấy chi tiết một yêu cầu sửa chữa
 */
export const getRepairById = async (req, res) => {
  try {
    const repair = await Repair.findById(req.params.id)
      .populate({
        path: "device_id",
        select: "name image description",
      })
      .populate({
        path: "device_instance_id",
        select: "serial_number status location condition",
      })
      .select("device_id device_instance_id serial_number quantity reason image status reason_rejected createdAt reviewed_at completed_at")
      .lean();

    if (!repair) {
      return res
        .status(404)
        .json({ success: false, message: "Repair request not found" });
    }

    res.json({ success: true, data: repair });
  } catch (err) {
    console.error("getRepairById error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

/**
 * GET /api/repairs/my
 * Lab Manager xem các yêu cầu mình tạo
 * (cần middleware auth set req.user._id)
 */
export const getMyRepairRequests = async (req, res) => {
  try {
    const userId = req.user?._id;

    const filter = {};
    if (userId) {
      filter.created_by = userId;
    }

    const repairs = await Repair.find(filter)
      .populate({
        path: "device_id",
        select: "name image",
      })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: repairs });
  } catch (err) {
    console.error("getMyRepairRequests error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

/**
 * PATCH /api/repairs/:id/status
 * body: { status }  // approved | in_progress | done | rejected
 * School Admin cập nhật trạng thái
 */
export const updateRepairStatus = async (req, res) => {
  try {
    const { status, reason_rejected } = req.body;
    const repair = await Repair.findById(req.params.id);

    if (!repair)
      return res.status(404).json({ success: false, message: "Không tìm thấy yêu cầu." });

    const oldStatus = repair.status;
    repair.status = status;

    // Xử lý inventory khi status thay đổi
    const inventory = await Inventory.findById(repair.inventory_id);
    if (!inventory) {
      return res.status(404).json({ success: false, message: "Không tìm thấy inventory." });
    }

    // Lấy instance nếu có để cập nhật trạng thái
    const instanceId = repair.device_instance_id;

    // ✅ Nếu sửa xong → hoàn lại available, giảm broken
    if (status === "done") {
      repair.completed_at = new Date();

      // Tính lại inventory từ DeviceInstance để đảm bảo chính xác
      // Không tính thiết bị retired vào total
      const totalInLab = await DeviceInstance.countDocuments({
        device_model_id: repair.device_id,
        location: "lab",
        status: { $ne: "retired" } // Không tính thiết bị đã retired
      });
      
      const availableInLab = await DeviceInstance.countDocuments({
        device_model_id: repair.device_id,
        location: "lab",
        status: "available"
      });
      
      const borrowedInLab = await DeviceInstance.countDocuments({
        device_model_id: repair.device_id,
        location: "lab",
        status: "borrowed"
      });
      
      const brokenInLab = await DeviceInstance.countDocuments({
        device_model_id: repair.device_id,
        location: "lab",
        status: "broken"
      });
      
      const repairingInLab = await DeviceInstance.countDocuments({
        device_model_id: repair.device_id,
        location: "lab",
        status: "repairing"
      });

      // Cập nhật inventory bằng cách set trực tiếp từ DeviceInstance
      // Lưu ý: repairing không được tính vào available (đang ở trường sửa)
      await Inventory.findByIdAndUpdate(inventory._id, {
        $set: {
          total: totalInLab,
          available: availableInLab,
          borrowed: borrowedInLab,
          broken: brokenInLab
          // repairing không được lưu vào inventory (đang ở trường)
        }
      });
      
      console.log(`[updateRepairStatus] Inventory updated: total=${totalInLab}, available=${availableInLab}, borrowed=${borrowedInLab}, broken=${brokenInLab}, repairing=${repairingInLab}`);

      // Trả thiết bị về trạng thái available và location = lab
      // Đây là khi trường sửa XONG → thiết bị về lab và đơn có thể hoàn thành
      if (instanceId) {
        await DeviceInstance.findByIdAndUpdate(instanceId, {
          $set: {
            status: "available",
            location: "lab", // Đảm bảo về lab
          },
        });
        console.log(`[updateRepairStatus] DeviceInstance ${instanceId} repaired and returned to lab`);

        // Tìm BorrowLab có repairing_items chứa device_instance_id này
        const borrowLab = await BorrowLab.findOne({
          "repairing_items.device_instances": instanceId,
          status: { $in: ["return_pending", "borrowed"] }
        });

        if (borrowLab) {
          // Tìm item trong repairing_items có chứa instance này
          for (let i = 0; i < borrowLab.repairing_items.length; i++) {
            const repairingItem = borrowLab.repairing_items[i];
            const instanceIds = (repairingItem.device_instances || []).map(id => id.toString());
            
            if (instanceIds.includes(instanceId.toString())) {
              // Giảm quantity
              repairingItem.quantity -= 1;
              
              // Xóa instance ID khỏi danh sách
              repairingItem.device_instances = repairingItem.device_instances.filter(
                id => id.toString() !== instanceId.toString()
              );
              
              // Nếu quantity = 0, xóa item khỏi danh sách
              if (repairingItem.quantity === 0) {
                borrowLab.repairing_items.splice(i, 1);
              }
              
              break;
            }
          }

          // Kiểm tra xem còn thiết bị nào chưa trả không
          const hasRemainingItems = borrowLab.items && borrowLab.items.length > 0;
          const hasRemainingRepairing = borrowLab.repairing_items && borrowLab.repairing_items.length > 0;

          if (!hasRemainingItems && !hasRemainingRepairing) {
            // Đã trả hết tất cả → chuyển sang "returned"
            borrowLab.status = "returned";
            borrowLab.returned = true;
            borrowLab.return_requested = false;
            
            // Gửi thông báo cho sinh viên
            try {
              await Notifications.create({
                user_id: borrowLab.student_id,
                type: "success",
                message: `Đơn mượn của bạn đã hoàn thành. Tất cả thiết bị đã được trả lại phòng Lab.`,
                related_id: borrowLab._id,
                related_type: "BorrowLab"
              });
            } catch (notifError) {
              console.error("Error creating notification:", notifError);
            }
          } else {
            // Vẫn còn thiết bị chưa trả
            borrowLab.status = "return_pending";
          }

          await borrowLab.save();
          console.log(`[updateRepairStatus] Updated BorrowLab ${borrowLab._id.toString().slice(-8)} after repair completion`);
        }
      }
    }

    // ✅ Nếu reject → hoàn lại available, giảm broken (vì thiết bị không thực sự hỏng)
    if (status === "rejected" && oldStatus === "pending") {
      inventory.broken = Math.max(0, inventory.broken - repair.quantity);
      inventory.available = Math.min(
        inventory.total - inventory.broken,
        inventory.available + repair.quantity
      );

      await inventory.save();

      // Khôi phục trạng thái instance về available
      if (instanceId) {
        await DeviceInstance.findByIdAndUpdate(instanceId, {
          $set: {
            status: "available",
          },
        });
      }

      repair.reason_rejected = reason_rejected || "Không có lý do";
    }

    // ✅ Nếu không sửa được → trừ thiết bị khỏi hệ thống (retired)
    if (status === "cannot_repair") {
      repair.completed_at = new Date();

      // Cập nhật DeviceInstance: status = "retired" (nghỉ hưu, không còn trong hệ thống)
      if (instanceId) {
        await DeviceInstance.findByIdAndUpdate(instanceId, {
          $set: {
            status: "retired",
            location: "lab", // Vẫn ở lab nhưng đã retired
          },
        });

        // Tìm BorrowLab có repairing_items chứa device_instance_id này
        const borrowLab = await BorrowLab.findOne({
          "repairing_items.device_instances": instanceId,
          status: { $in: ["return_pending", "borrowed"] }
        });

        if (borrowLab) {
          // Tìm item trong repairing_items có chứa instance này
          for (let i = 0; i < borrowLab.repairing_items.length; i++) {
            const repairingItem = borrowLab.repairing_items[i];
            const instanceIds = (repairingItem.device_instances || []).map(id => id.toString());
            
            if (instanceIds.includes(instanceId.toString())) {
              // Giảm quantity
              repairingItem.quantity -= 1;
              
              // Xóa instance ID khỏi danh sách
              repairingItem.device_instances = repairingItem.device_instances.filter(
                id => id.toString() !== instanceId.toString()
              );
              
              // Nếu quantity = 0, xóa item khỏi danh sách
              if (repairingItem.quantity === 0) {
                borrowLab.repairing_items.splice(i, 1);
              }
              
              break;
            }
          }

          // Kiểm tra xem còn thiết bị nào chưa trả không
          const hasRemainingItems = borrowLab.items && borrowLab.items.length > 0;
          const hasRemainingRepairing = borrowLab.repairing_items && borrowLab.repairing_items.length > 0;

          if (!hasRemainingItems && !hasRemainingRepairing) {
            // Đã trả hết tất cả (thiết bị hỏng không sửa được đã được trừ khỏi hệ thống) → "returned"
            borrowLab.status = "returned";
            borrowLab.returned = true;
            borrowLab.return_requested = false;
            
            // Gửi thông báo cho sinh viên
            try {
              await Notifications.create({
                user_id: borrowLab.student_id,
                type: "info",
                message: `Đơn mượn của bạn đã hoàn thành. Thiết bị hỏng không sửa được đã được trừ khỏi hệ thống.`,
                related_id: borrowLab._id,
                related_type: "BorrowLab"
              });
            } catch (notifError) {
              console.error("Error creating notification:", notifError);
            }
          } else {
            // Vẫn còn thiết bị chưa trả
            borrowLab.status = "return_pending";
          }

          await borrowLab.save();
          console.log(
            `[updateRepairStatus] Updated BorrowLab ${borrowLab._id
              .toString()
              .slice(-8)} after cannot_repair`
          );
        }
      }

      // Tính lại inventory từ DeviceInstance (thiết bị retired không được tính vào total)
      const totalInLab = await DeviceInstance.countDocuments({
        device_model_id: repair.device_id,
        location: "lab",
        status: { $ne: "retired" }, // Không tính thiết bị retired
      });

      const availableInLab = await DeviceInstance.countDocuments({
        device_model_id: repair.device_id,
        location: "lab",
        status: "available",
      });

      const borrowedInLab = await DeviceInstance.countDocuments({
        device_model_id: repair.device_id,
        location: "lab",
        status: "borrowed",
      });

      const brokenInLab = await DeviceInstance.countDocuments({
        device_model_id: repair.device_id,
        location: "lab",
        status: "broken",
      });

      // Cập nhật inventory: giảm total và broken
      await Inventory.findByIdAndUpdate(inventory._id, {
        $set: {
          total: totalInLab,
          available: availableInLab,
          borrowed: borrowedInLab,
          broken: brokenInLab,
        },
      });

      console.log(
        `[updateRepairStatus] Device ${instanceId} marked as retired (cannot repair)`
      );
    }

    // Khi admin duyệt HOẶC từ chối thì lưu ngày xử lý
    if (["approved", "rejected"].includes(status)) {
      repair.reviewed_at = new Date();
    }

    // Khi admin duyệt thì cập nhật trạng thái thiết bị
    if (status === "approved") {
      // Nếu có device_instance_id, đảm bảo thiết bị ở trạng thái "repairing"
      // (đang được gửi về trường để sửa)
      if (instanceId) {
        const instance = await DeviceInstance.findById(instanceId);
        if (instance && instance.status !== "repairing") {
          await DeviceInstance.findByIdAndUpdate(instanceId, {
            $set: {
              status: "repairing", // Đang sửa chữa tại trường
            },
          });
          console.log(
            `[updateRepairStatus] DeviceInstance ${instanceId} set to repairing (sent to school for repair)`
          );
        }
      }
    }


    await repair.save();

    res.json({
      success: true,
      message: "Cập nhật trạng thái thành công.",
      data: repair,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi server." });
  }
};

export const getRepairByDevice = async (req, res) => {
  try {
    const repair = await Repair.findOne({
      device_id: req.params.deviceId,
      status: { $in: ["pending", "approved", "in_progress"] }
    })
      .sort({ createdAt: -1 });

    if (!repair)
      return res.status(200).json({
        success: true,
        data: null
      });

    res.json({
      success: true,
      data: repair
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


// ================== GET REPAIR HISTORY BY DEVICE INSTANCE ==================
export const getRepairHistoryByInstance = async (req, res) => {
  try {
    const { deviceInstanceId } = req.params;

    const instance = await DeviceInstance.findById(deviceInstanceId)
      .select("serial_number usage_stats.total_repair_times status condition")
      .lean();

    if (!instance) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thiết bị"
      });
    }

    const repairs = await Repair.find({
      device_instance_id: deviceInstanceId
    })
      .populate({
        path: "device_id",
        select: "name image"
      })
      .sort({ createdAt: -1 })
      .lean();

    const totalRepairTimes = instance.usage_stats?.total_repair_times || 0;

    return res.json({
      success: true,
      data: {
        instance,
        repairs,
        warning: totalRepairTimes >= 5,
        totalRepairTimes
      }
    });

  } catch (err) {
    console.error("getRepairHistoryByInstance error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

