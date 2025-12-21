import mongoose from "mongoose";
import BorrowLab from "../../models/BorrowLab.js";
import User from "../../models/User.js";
import Device from "../../models/Device.js";
import DeviceInstance from "../../models/DeviceInstance.js";
import Notifications from "../../models/Notifications.js";
import ReturnLab from "../../models/ReturnLab.js";
import Inventory from "../../models/Inventory.js";
import Repair from "../../models/Repair.js";

// Lấy danh sách tất cả yêu cầu mượn (không nhóm theo sinh viên)
export const getBorrowingStudents = async (req, res) => {
  try {
    // Lấy tất cả các yêu cầu mượn (bao gồm cả đã trả xong)
    const borrowRecords = await BorrowLab.find({
      status: { $in: ["borrowed", "return_pending", "return_requested", "returned"] },
    })
      .populate("student_id", "name email username student_code phone")
      .populate({
        path: "items.device_id",
        select: "name image category",
        strictPopulate: false,
      })
      .populate({
        path: "items.device_instances",
        select: "serial_number status condition",
        strictPopulate: false,
      })
      .populate({
        path: "repairing_items.device_id",
        select: "name image category",
        strictPopulate: false,
      })
      .populate({
        path: "repairing_items.device_instances",
        select: "serial_number status condition",
        strictPopulate: false,
      })
      .sort({ createdAt: -1 })
      .lean();

    // Format dữ liệu: mỗi BorrowLab record là một dòng
    // Sử dụng Promise.all vì có thể cần async operations để tìm device_instances cho dữ liệu cũ
    const borrowList = await Promise.all(borrowRecords.map(async (record) => {
      const returnDueDate = new Date(record.return_due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      returnDueDate.setHours(0, 0, 0, 0);
      
      const isOverdue = returnDueDate < today;
      
      // Tính tổng số lượng thiết bị mà sinh viên VẪN ĐANG CẦM (chưa trả)
      // Bao gồm: items (thiết bị chưa trả) + repairing_items (thiết bị hỏng đang sửa)
      let totalQuantity = 0;
      
      // Tính từ items (thiết bị chưa trả)
      const items = (record.items || []).map((item) => {
        totalQuantity += item.quantity || 0;
        
        // Lấy danh sách serial numbers từ device_instances
        const serialNumbers = (item.device_instances || [])
          .map(inst => inst.serial_number || inst._id?.toString().slice(-8))
          .filter(Boolean);
        
        return {
          device: {
            _id: item.device_id?._id || item.device_id,
            name: item.device_id?.name || "N/A",
            image: item.device_id?.image || "",
            category: item.device_id?.category || "",
          },
          quantity: item.quantity || 0,
          serialNumbers: serialNumbers, // Thêm serial numbers
          device_instances: item.device_instances || [], // Giữ nguyên để frontend có thể dùng
        };
      });

      // Cộng thêm số lượng thiết bị đang sửa chữa (thiết bị hỏng sinh viên vẫn đang cầm)
      // Sử dụng Promise.all vì có thể cần async operations để tìm device_instances cho dữ liệu cũ
      const repairingItems = await Promise.all((record.repairing_items || []).map(async (item) => {
        totalQuantity += item.quantity || 0;
        
        // Lấy danh sách serial numbers từ device_instances
        let serialNumbers = [];
        let deviceInstances = item.device_instances || [];
        
        // Nếu device_instances rỗng (dữ liệu cũ), thử tìm từ DeviceInstance
        // Lưu ý: Đây là fallback cho dữ liệu cũ, logic mới sẽ luôn có device_instances
        if (deviceInstances.length === 0 && item.device_id && item.quantity > 0) {
          console.warn(`[getBorrowingStudents] BorrowId ${record._id.toString().slice(-8)}: repairing_item có device_instances rỗng (dữ liệu cũ), đang tìm từ DeviceInstance...`);
          
          // Tìm DeviceInstance có device_model_id, status = "broken" hoặc "repairing"
          // và location = "lab" (đã trả về lab nhưng chưa sửa)
          // Hoặc đang ở trường sửa (repairing)
          const foundInstances = await DeviceInstance.find({
            device_model_id: item.device_id._id || item.device_id,
            status: { $in: ["broken", "repairing"] },
            location: { $in: ["lab", "repair_shop"] }
          })
          .sort({ updatedAt: -1 }) // Lấy các instance mới nhất
          .limit(item.quantity)
          .lean();
          
          if (foundInstances.length > 0) {
            deviceInstances = foundInstances.map(inst => inst._id);
            console.log(`  - Found ${foundInstances.length} DeviceInstances for repairing_item (fallback for old data)`);
            
            // Cập nhật lại BorrowLab để lưu device_instances (chỉ cập nhật nếu thực sự rỗng)
            try {
              const borrowRecord = await BorrowLab.findById(record._id);
              if (borrowRecord) {
                const repairingItem = borrowRecord.repairing_items.find(
                  ri => ri.device_id.toString() === (item.device_id._id || item.device_id).toString()
                );
                if (repairingItem && (!repairingItem.device_instances || repairingItem.device_instances.length === 0)) {
                  repairingItem.device_instances = deviceInstances;
                  await borrowRecord.save();
                  console.log(`  - Updated BorrowLab with device_instances (fixed old data)`);
                }
              }
            } catch (updateError) {
              console.error(`  - Error updating BorrowLab:`, updateError);
            }
          } else {
            console.warn(`  - Không tìm thấy DeviceInstance cho repairing_item (có thể đã được xử lý hoặc dữ liệu không đồng bộ)`);
          }
        }
        
        // Populate device_instances nếu chưa được populate
        let populatedDeviceInstances = [];
        if (deviceInstances.length > 0 && typeof deviceInstances[0] === 'object' && deviceInstances[0].serial_number) {
          // Đã được populate
          populatedDeviceInstances = deviceInstances;
          serialNumbers = deviceInstances.map(inst => inst.serial_number || inst._id?.toString().slice(-8)).filter(Boolean);
        } else if (deviceInstances.length > 0) {
          // Chưa được populate, cần populate
          const instanceIds = deviceInstances.map(inst => inst._id || inst);
          populatedDeviceInstances = await DeviceInstance.find({
            _id: { $in: instanceIds }
          }).select("serial_number _id").lean();
          serialNumbers = populatedDeviceInstances.map(inst => inst.serial_number).filter(Boolean);
        }
        
        // Lấy repair status từ Repair model cho các device_instance_id
        let overallRepairStatus = "pending";
        let repairStatusMap = {};
        if (populatedDeviceInstances.length > 0) {
          const instanceIds = populatedDeviceInstances.map(inst => inst._id || inst);
          const repairs = await Repair.find({
            device_instance_id: { $in: instanceIds },
            device_id: item.device_id._id || item.device_id
          }).select("device_instance_id status").lean();
          
          // Tạo map để dễ tra cứu repair status theo instance_id
          repairs.forEach(repair => {
            if (repair.device_instance_id) {
              repairStatusMap[repair.device_instance_id.toString()] = repair.status;
            }
          });
          
          // Xác định trạng thái chung: nếu tất cả đều "done" thì "done", nếu có ít nhất 1 "in_progress" hoặc "approved" thì "in_progress", còn lại là "pending"
          const repairStatuses = repairs.map(r => r.status);
          if (repairStatuses.length > 0) {
            if (repairStatuses.every(s => s === "done")) {
              overallRepairStatus = "done";
            } else if (repairStatuses.some(s => s === "in_progress" || s === "approved")) {
              overallRepairStatus = "in_progress";
            } else if (repairStatuses.some(s => s === "rejected")) {
              overallRepairStatus = "rejected";
            }
          }
        }
        
        return {
          device: {
            _id: item.device_id?._id || item.device_id,
            name: item.device_id?.name || "N/A",
            image: item.device_id?.image || "",
            category: item.device_id?.category || "",
          },
          quantity: item.quantity || 0,
          broken_reason: item.broken_reason,
          reported_at: item.reported_at,
          serialNumbers: serialNumbers, // Thêm serial numbers
          device_instances: populatedDeviceInstances.length > 0 ? populatedDeviceInstances : deviceInstances, // Trả về populated instances
          repairStatus: overallRepairStatus, // Thêm repair status
          repairStatusMap: repairStatusMap, // Map status cho từng instance
        };
      }));
      
      // Debug log để kiểm tra
      console.log(`[getBorrowingStudents] BorrowId: ${record._id.toString().slice(-8)}`);
      console.log(`  - record.items (raw):`, JSON.stringify(record.items || []));
      console.log(`  - record.repairing_items (raw):`, JSON.stringify(record.repairing_items || []));
      console.log(`  - items: ${items.length} items, total quantity: ${items.reduce((sum, item) => sum + item.quantity, 0)}`);
      console.log(`  - repairing_items: ${repairingItems.length} items, total quantity: ${repairingItems.reduce((sum, item) => sum + item.quantity, 0)}`);
      console.log(`  - totalQuantity (đang cầm): ${totalQuantity}`);

      return {
        borrowId: record._id,
        borrowIdString: record._id.toString(),
        student: {
          _id: record.student_id._id,
          name: record.student_id.name || "Chưa có tên",
          email: record.student_id.email || "",
          username: record.student_id.username || "",
          student_code: record.student_id.student_code || "",
          phone: record.student_id.phone || "",
        },
        returnDueDate: record.return_due_date,
        purpose: record.purpose || "",
        notes: record.notes || "",
        status: record.status,
        borrowedAt: record.createdAt,
        isOverdue: isOverdue,
        returnRequested: record.return_requested || false,
        returnRequestedAt: record.return_requested_at || null,
        items: items,
        repairingItems: repairingItems, // THÊM: Trả về repairing_items đã populate
        totalQuantity: totalQuantity,
      };
    }));

    return res.status(200).json({
      success: true,
      data: borrowList,
      total: borrowList.length,
    });
  } catch (error) {
    console.error("getBorrowingStudents error:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách yêu cầu mượn",
      error: error.message,
    });
  }
};

// Yêu cầu trả thiết bị quá hạn
export const requestReturn = async (req, res) => {
  try {
    const { borrowId } = req.body;

    if (!borrowId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc",
      });
    }

    // Tìm record mượn
    const borrowRecord = await BorrowLab.findById(borrowId);
    
    if (!borrowRecord) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bản ghi mượn",
      });
    }

    // Kiểm tra xem có quá hạn không
    const returnDueDate = new Date(borrowRecord.return_due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    returnDueDate.setHours(0, 0, 0, 0);

    if (returnDueDate >= today) {
      return res.status(400).json({
        success: false,
        message: "Thiết bị chưa quá hạn, không thể yêu cầu trả",
      });
    }

    // Cập nhật trạng thái
    borrowRecord.return_requested = true;
    borrowRecord.return_requested_at = new Date();
    borrowRecord.status = "return_requested";

    await borrowRecord.save();

    // Tạo thông báo cho sinh viên
    try {
      await Notifications.create({
        user_id: borrowRecord.student_id,
        type: "return_request",
        message: `Bạn được yêu cầu trả lại thiết bị đã quá hạn. Vui lòng liên hệ phòng Lab để trả thiết bị.`,
      });
    } catch (notifError) {
      console.error("Error creating notification:", notifError);
      // Không throw error, chỉ log
    }

    return res.status(200).json({
      success: true,
      message: "Đã gửi yêu cầu trả thiết bị quá hạn cho sinh viên",
      data: borrowRecord,
    });
  } catch (error) {
    console.error("requestReturn error:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể yêu cầu trả thiết bị",
      error: error.message,
    });
  }
};

// Ghi nhận trả thiết bị
export const recordReturn = async (req, res) => {
  try {
    const { borrowId, deviceId, quantity, brokenQuantity = 0, brokenReason, instanceIds, brokenInstanceIds: frontendBrokenInstanceIds, sendToSchoolRepair = false } = req.body;

    if (!borrowId || !deviceId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc",
      });
    }

    // Kiểm tra số lượng hỏng không được vượt quá số lượng trả
    if (brokenQuantity > quantity) {
      return res.status(400).json({
        success: false,
        message: "Số lượng hỏng không được vượt quá số lượng trả",
      });
    }

    // Tìm record mượn
    const borrowRecord = await BorrowLab.findById(borrowId).populate("student_id");
    
    if (!borrowRecord) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bản ghi mượn",
      });
    }

    // Tìm item trong record
    const itemIndex = borrowRecord.items.findIndex(
      (item) => item.device_id.toString() === deviceId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thiết bị trong bản ghi mượn",
      });
    }

    const item = borrowRecord.items[itemIndex];

    // Kiểm tra số lượng trả
    if (quantity > item.quantity) {
      return res.status(400).json({
        success: false,
        message: "Số lượng trả không được vượt quá số lượng mượn",
      });
    }

    // Kiểm tra nếu thiết bị quá hạn, phải đã được yêu cầu trả
    const returnDueDate = new Date(borrowRecord.return_due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    returnDueDate.setHours(0, 0, 0, 0);

    if (returnDueDate < today && !borrowRecord.return_requested) {
      return res.status(400).json({
        success: false,
        message: "Thiết bị quá hạn. Vui lòng yêu cầu trả trước khi ghi nhận trả.",
      });
    }

    // Tìm hoặc tạo ReturnLab record
    let returnRecord = await ReturnLab.findOne({ borrow_id: borrowId });
    
    if (!returnRecord) {
      returnRecord = new ReturnLab({
        borrow_id: borrowId,
        student_id: borrowRecord.student_id._id,
        items: [],
        status: "pending_check",
      });
    }

    // Thêm item vào ReturnLab
    const returnItemIndex = returnRecord.items.findIndex(
      (returnItem) => returnItem.device_id.toString() === deviceId
    );

    const returnItemData = {
      device_id: deviceId,
      quantity: quantity,
      broken: brokenQuantity || 0,
    };

    if (returnItemIndex === -1) {
      returnRecord.items.push(returnItemData);
    } else {
      returnRecord.items[returnItemIndex].quantity += quantity;
      returnRecord.items[returnItemIndex].broken += brokenQuantity || 0;
    }

    await returnRecord.save();

    // Cập nhật DeviceInstance và Inventory
    const goodQuantity = quantity - (brokenQuantity || 0);
    
    // Lấy các DeviceInstance đã được gán cho đơn mượn này
    const deviceInstances = item.device_instances || [];
    
    // Nếu có instanceIds từ frontend, sử dụng chúng; nếu không, dùng slice theo quantity
    let instancesToReturn = [];
    let brokenInstanceIds = req.body.brokenInstanceIds || []; // Lấy danh sách instance IDs bị hỏng
    
    if (instanceIds && Array.isArray(instanceIds) && instanceIds.length > 0) {
      // Lọc các instance IDs từ device_instances
      instancesToReturn = deviceInstances.filter(inst => {
        const instId = inst._id?.toString() || inst.toString();
        return instanceIds.includes(instId);
      });
      
      // Kiểm tra số lượng instance IDs phải khớp với quantity
      if (instancesToReturn.length !== quantity) {
        return res.status(400).json({
          success: false,
          message: `Số lượng instance IDs (${instancesToReturn.length}) không khớp với số lượng trả (${quantity})`,
        });
      }
      
      // Kiểm tra số lượng broken instance IDs phải khớp với brokenQuantity
      if (brokenInstanceIds.length !== brokenQuantity) {
        return res.status(400).json({
          success: false,
          message: `Số lượng instance IDs hỏng (${brokenInstanceIds.length}) không khớp với số lượng hỏng (${brokenQuantity})`,
        });
      }
    } else {
      // Fallback: dùng slice theo quantity như cũ
      instancesToReturn = deviceInstances.slice(0, quantity);
      // Nếu không có brokenInstanceIds, giả định các instance cuối cùng là hỏng
      if (brokenQuantity > 0) {
        brokenInstanceIds = instancesToReturn.slice(goodQuantity, quantity).map(i => i._id?.toString() || i.toString());
      }
    }
    
    // Debug log
    console.log(`[recordReturn] DeviceInstance and Inventory update:`);
    console.log(`  - deviceId: ${deviceId} (type: ${typeof deviceId})`);
    console.log(`  - quantity = ${quantity}, brokenQuantity = ${brokenQuantity}, goodQuantity = ${goodQuantity}`);
    console.log(`  - Total device_instances: ${deviceInstances.length}, instancesToReturn: ${instancesToReturn.length}`);
    console.log(`  - brokenInstanceIds: ${brokenInstanceIds.length} instances`);
    
    // Phân loại instances thành good và broken
    const goodInstances = instancesToReturn.filter(inst => {
      const instId = inst._id?.toString() || inst.toString();
      return !brokenInstanceIds.includes(instId);
    });
    
    const brokenInstances = instancesToReturn.filter(inst => {
      const instId = inst._id?.toString() || inst.toString();
      return brokenInstanceIds.includes(instId);
    });
    
    // Debug log để kiểm tra
    console.log(`  - goodInstances: ${goodInstances.length}, brokenInstances: ${brokenInstances.length}`);
    console.log(`  - brokenInstanceIds: ${JSON.stringify(brokenInstanceIds)}`);
    if (brokenInstances.length > 0) {
      console.log(`  - brokenInstances IDs: ${brokenInstances.map(i => i._id?.toString() || i.toString()).join(', ')}`);
    }
    
    // Cập nhật DeviceInstance: thiết bị tốt
    if (goodInstances.length > 0) {
      await DeviceInstance.updateMany(
        { _id: { $in: goodInstances.map(i => i._id || i) } },
        {
          $set: {
            status: "available",
            location: "lab", // Đảm bảo location về lab
            current_holder: null
          }
        }
      );
      
      console.log(`  - Updated ${goodInstances.length} good instances to available`);
    }
    
    // Cập nhật DeviceInstance: thiết bị hỏng
    if (brokenInstances.length > 0) {
      await DeviceInstance.updateMany(
        { _id: { $in: brokenInstances.map(i => i._id || i) } },
        {
          $set: {
            status: "broken",
            condition: "poor",
            location: "lab", // Đảm bảo location về lab
            current_holder: null
          }
        }
      );
      
      console.log(`  - Updated ${brokenInstances.length} broken instances to broken`);
    }
    
    // Cập nhật Inventory - Tính lại từ DeviceInstance để đảm bảo chính xác
    const inventory = await Inventory.findOne({
      device_id: deviceId,
      location: "lab",
    });
    
    // Tính lại số lượng thực tế từ DeviceInstance sau khi cập nhật
    const totalInLab = await DeviceInstance.countDocuments({
      device_model_id: deviceId,
      location: "lab"
    });
    
    const availableInLab = await DeviceInstance.countDocuments({
      device_model_id: deviceId,
      location: "lab",
      status: "available"
    });
    
    const borrowedInLab = await DeviceInstance.countDocuments({
      device_model_id: deviceId,
      location: "lab",
      status: "borrowed"
    });
    
    const brokenInLab = await DeviceInstance.countDocuments({
      device_model_id: deviceId,
      location: "lab",
      status: "broken"
    });
    
    if (inventory) {
      // Cập nhật bằng cách set trực tiếp từ DeviceInstance (không dùng $inc để tránh sai lệch)
      await Inventory.findByIdAndUpdate(inventory._id, {
        $set: {
          total: totalInLab,
          available: availableInLab,
          borrowed: borrowedInLab,
          broken: brokenInLab
        }
      });
      
      console.log(`  - Inventory updated from DeviceInstance:`);
      console.log(`    - total: ${totalInLab}, available: ${availableInLab}, borrowed: ${borrowedInLab}, broken: ${brokenInLab}`);
    } else {
      // Nếu chưa có inventory record, tạo mới
      await Inventory.create({
        device_id: deviceId,
        location: "lab",
        total: totalInLab,
        available: availableInLab,
        borrowed: borrowedInLab,
        broken: brokenInLab
      });
      
      console.log(`  - Created new inventory record`);
    }

    // Nếu có thiết bị hỏng, LUÔN gửi về trường sửa (sinh viên không được tự sửa)
    if (brokenQuantity > 0) {
      // LUÔN gửi về trường sửa
      console.log(`[recordReturn] Gửi ${brokenQuantity} thiết bị hỏng về trường sửa (bắt buộc)`);
        
        // Lấy các instance IDs của thiết bị hỏng
        const brokenInstanceIdsForRepairing = brokenInstances.map(inst => {
          if (inst._id) {
            return inst._id;
          } else if (inst instanceof mongoose.Types.ObjectId) {
            return inst;
          } else {
            return new mongoose.Types.ObjectId(inst);
          }
        }).filter(Boolean);
        
        if (brokenInstanceIdsForRepairing.length === 0) {
          return res.status(400).json({
            success: false,
            message: `Không thể xác định mã serial của thiết bị hỏng. Vui lòng thử lại.`,
          });
        }
        
        // Tạo Repair request cho từng thiết bị hỏng
        for (const instanceId of brokenInstanceIdsForRepairing) {
          const instance = await DeviceInstance.findById(instanceId);
          if (instance) {
            // Tìm inventory_id cho thiết bị này (location = "lab")
            const inventory = await Inventory.findOne({
              device_id: deviceId,
              location: "lab"
            });
            
            // Tạo Repair request - Tự động tạo yêu cầu sửa chữa gửi về School Admin
            const repairData = {
              device_instance_id: instanceId,
              device_id: deviceId,
              serial_number: instance.serial_number,
              quantity: 1, // Mỗi instance là 1 thiết bị
              reported_by: req.user._id || req.user.id, // Lab Manager báo cáo thiết bị hỏng
              reason: brokenReason || `Thiết bị hỏng khi sinh viên ${borrowRecord.student_id.name || 'N/A'} trả lại. Đã được Lab Manager kiểm tra và gửi về trường để sửa chữa.`,
              repair_type: "internal", // Sửa nội bộ
              status: "pending", // Chờ School Admin duyệt và sửa chữa
              compensation_required: false,
            };
            
            // Thêm inventory_id nếu có
            if (inventory) {
              repairData.inventory_id = inventory._id;
            }
            
            await Repair.create(repairData);
            
            console.log(`  - Created Repair request for instance ${instanceId.toString().slice(-8)} with status: pending`);
            
            // Cập nhật DeviceInstance: status = "repairing", location = "repair_shop"
            await DeviceInstance.findByIdAndUpdate(instanceId, {
              $set: {
                status: "repairing",
                location: "repair_shop",
                current_holder: null
              }
            });
            
            console.log(`  - Created Repair request for instance ${instanceId.toString().slice(-8)}`);
          }
        }
        
        // Xóa TẤT CẢ instances đã trả (cả good và broken) khỏi items.device_instances
        // Vì thiết bị đã được trả (dù tốt hay hỏng)
        const allInstanceIdsToRemove = instancesToReturn.map(i => {
          const id = i._id || i;
          return id.toString();
        });
        item.device_instances = item.device_instances.filter(
          inst => !allInstanceIdsToRemove.includes((inst._id || inst).toString())
        );
        
        // Giảm quantity của item = TỔNG số lượng đã trả (cả good và broken)
        // Vì sinh viên đã trả thiết bị (dù tốt hay hỏng)
        item.quantity -= quantity;
        
        // Chuyển thiết bị hỏng vào repairing_items
        if (!borrowRecord.repairing_items) {
          borrowRecord.repairing_items = [];
        }
        
        const repairingItemIndex = borrowRecord.repairing_items.findIndex(
          (repairItem) => repairItem.device_id.toString() === deviceId
        );
        
        const repairingItemData = {
          device_id: deviceId,
          quantity: brokenQuantity,
          broken_reason: brokenReason || `Thiết bị bị hỏng khi sinh viên ${borrowRecord.student_id.name || 'N/A'} trả lại. Đã gửi về trường sửa.`,
          reported_at: new Date(),
          device_instances: brokenInstanceIdsForRepairing,
        };
        
        if (repairingItemIndex === -1) {
          borrowRecord.repairing_items.push(repairingItemData);
        } else {
          borrowRecord.repairing_items[repairingItemIndex].quantity += brokenQuantity;
          const existingInstanceIds = (borrowRecord.repairing_items[repairingItemIndex].device_instances || []).map(id => id.toString());
          const newInstanceIds = brokenInstanceIdsForRepairing.filter(id => !existingInstanceIds.includes(id.toString()));
          borrowRecord.repairing_items[repairingItemIndex].device_instances = [
            ...borrowRecord.repairing_items[repairingItemIndex].device_instances,
            ...newInstanceIds
          ];
        }
        
        console.log(`  - Moved ${brokenQuantity} broken instances to repairing_items`);
        
        // Cập nhật Inventory: giảm broken, tăng repairing
        const repairingInLab = await DeviceInstance.countDocuments({
          device_model_id: deviceId,
          location: "lab",
          status: "repairing"
        });
        
        const repairingInRepairShop = await DeviceInstance.countDocuments({
          device_model_id: deviceId,
          location: "repair_shop",
          status: "repairing"
        });
        
        const totalRepairing = repairingInLab + repairingInRepairShop;
        
        await Inventory.findOneAndUpdate(
          { device_id: deviceId, location: "lab" },
          {
            $set: {
              total: totalInLab,
              available: availableInLab,
              borrowed: borrowedInLab,
              broken: brokenInLab - brokenQuantity, // Giảm broken
              repairing: totalRepairing // Tăng repairing
            }
          },
          { upsert: true, new: true }
        );
        
        // Gửi thông báo cho sinh viên
        try {
          await Notifications.create({
            user_id: borrowRecord.student_id._id,
            type: "info",
            message: `${brokenQuantity} thiết bị hỏng của bạn đã được gửi về trường để sửa chữa. Sau khi trường sửa xong, thiết bị sẽ tự động được cập nhật là đã trả.`,
          });
        } catch (notifError) {
          console.error("Error creating notification:", notifError);
        }
    } else {
      // Nếu không có thiết bị hỏng, xử lý bình thường
      // Xóa các instance đã trả khỏi device_instances
      if (instancesToReturn.length > 0) {
        const instanceIdsToRemove = instancesToReturn.map(i => i._id || i);
        item.device_instances = item.device_instances.filter(
          inst => !instanceIdsToRemove.some(id => (inst._id || inst).toString() === id.toString())
        );
        console.log(`  - Removed ${instancesToReturn.length} instances from device_instances`);
      }
      
      // Giảm quantity
      item.quantity -= quantity;
    }

    // Debug log - Đã xử lý xong, kiểm tra kết quả
    console.log(`[recordReturn] BorrowId: ${borrowId.toString().slice(-8)}`);
    console.log(`  - Initial item.quantity = ${item.quantity + quantity}, returned quantity = ${quantity}, brokenQuantity = ${brokenQuantity}, goodQuantity = ${quantity - (brokenQuantity || 0)}`);

    // Nếu đã trả hết, xóa item khỏi danh sách
    if (item.quantity === 0) {
      borrowRecord.items.splice(itemIndex, 1);
    }
    
    // Debug log sau khi cập nhật
    const remainingItemsQuantity = borrowRecord.items.reduce((sum, item) => sum + item.quantity, 0);
    const repairingItemsQuantity = (borrowRecord.repairing_items || []).reduce((sum, item) => sum + item.quantity, 0);
    console.log(`  - After: item.quantity = ${item.quantity}, items.length = ${borrowRecord.items.length}`);
    console.log(`  - Remaining items quantity: ${remainingItemsQuantity}`);
    console.log(`  - Repairing items quantity: ${repairingItemsQuantity}`);
    console.log(`  - Total quantity (đang cầm): ${remainingItemsQuantity + repairingItemsQuantity}`);

    // Cập nhật status dựa trên cả items VÀ repairing_items
    // QUAN TRỌNG: Thiết bị hỏng KHÔNG được tính là đã trả hoàn toàn
    // - items: thiết bị tốt chưa trả
    // - repairing_items: thiết bị hỏng đang sửa (sinh viên vẫn đang cầm để sửa)
    const hasRemainingItems = borrowRecord.items.length > 0;
    const hasRepairingItems = borrowRecord.repairing_items && borrowRecord.repairing_items.length > 0;
    
    // ⚠️ QUAN TRỌNG: Nếu có repairing_items, đơn CHƯA BAO GIỜ được coi là hoàn thành
    // Thiết bị hỏng chỉ được coi là "đem đi sửa", không phải "đã trả"
    if (hasRepairingItems) {
      // Còn thiết bị hỏng đang sửa → CHƯA hoàn thành, status = "return_pending"
      borrowRecord.returned = false; // CHƯA trả xong vì còn thiết bị hỏng đang sửa
      borrowRecord.status = "return_pending";
      borrowRecord.return_requested = false;
      console.log(`  - Status: return_pending (còn ${borrowRecord.repairing_items.length} thiết bị hỏng đang sửa)`);
    } else if (!hasRemainingItems && !hasRepairingItems) {
      // Đã trả hết TẤT CẢ (cả tốt và đã sửa xong) → "returned"
      borrowRecord.returned = true;
      borrowRecord.status = "returned";
      borrowRecord.return_requested = false;
      returnRecord.status = "done";
      returnRecord.processed_at = new Date();
      await returnRecord.save();
      console.log(`  - Status: returned (đã trả hết tất cả thiết bị)`);
    } else {
      // Còn thiết bị tốt chưa trả → "return_pending"
      borrowRecord.status = "return_pending";
      borrowRecord.returned = false;
      console.log(`  - Status: return_pending (còn ${borrowRecord.items.length} thiết bị tốt chưa trả)`);
    }

    // LƯU QUAN TRỌNG: Phải save borrowRecord để cập nhật item.quantity và repairing_items
    await borrowRecord.save();
    
    // Debug log sau khi save
    console.log(`  - borrowRecord saved successfully`);
    console.log(`  - Final items.length: ${borrowRecord.items.length}`);
    console.log(`  - Final repairing_items.length: ${borrowRecord.repairing_items?.length || 0}`);

    let message = "Ghi nhận trả thiết bị thành công";
    if (brokenQuantity > 0) {
      message += `. Đã nhận ${goodQuantity} thiết bị tốt. ${brokenQuantity} thiết bị hỏng cần sinh viên tự sửa chữa và trả lại.`;
    }

    return res.status(200).json({
      success: true,
      message: message,
      data: {
        borrowRecord,
        returnRecord,
        goodQuantity: goodQuantity,
        brokenQuantity: brokenQuantity || 0,
        repairingItems: borrowRecord.repairing_items || [],
      },
    });
  } catch (error) {
    console.error("recordReturn error:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể ghi nhận trả thiết bị",
      error: error.message,
    });
  }
};

// Ghi nhận trả thiết bị đã sửa chữa (sinh viên trả lại sau khi sửa)
export const recordRepairedReturn = async (req, res) => {
  try {
    const { borrowId, deviceId, quantity } = req.body;

    if (!borrowId || !deviceId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc",
      });
    }

    // Tìm record mượn
    const borrowRecord = await BorrowLab.findById(borrowId).populate("student_id");
    
    if (!borrowRecord) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bản ghi mượn",
      });
    }

    // Tìm thiết bị trong repairing_items
    if (!borrowRecord.repairing_items || borrowRecord.repairing_items.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không có thiết bị nào đang sửa chữa",
      });
    }

    const repairingItemIndex = borrowRecord.repairing_items.findIndex(
      (item) => item.device_id.toString() === deviceId
    );

    if (repairingItemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thiết bị đang sửa chữa trong bản ghi",
      });
    }

    const repairingItem = borrowRecord.repairing_items[repairingItemIndex];

    // Kiểm tra số lượng trả
    if (quantity > repairingItem.quantity) {
      return res.status(400).json({
        success: false,
        message: "Số lượng trả không được vượt quá số lượng đang sửa chữa",
      });
    }

    // Tìm hoặc tạo ReturnLab record
    let returnRecord = await ReturnLab.findOne({ borrow_id: borrowId });
    
    if (!returnRecord) {
      returnRecord = new ReturnLab({
        borrow_id: borrowId,
        student_id: borrowRecord.student_id._id,
        items: [],
        status: "pending_check",
      });
    }

    // Thêm item đã sửa vào ReturnLab
    const returnItemIndex = returnRecord.items.findIndex(
      (returnItem) => returnItem.device_id.toString() === deviceId
    );

    const returnItemData = {
      device_id: deviceId,
      quantity: quantity,
      broken: 0, // Đã sửa xong nên broken = 0
    };

    if (returnItemIndex === -1) {
      returnRecord.items.push(returnItemData);
    } else {
      returnRecord.items[returnItemIndex].quantity += quantity;
    }

    await returnRecord.save();

    // Cập nhật Inventory - nhận thiết bị đã sửa vào available
    const inventory = await Inventory.findOne({
      device_id: deviceId,
      location: "lab",
    });

    if (inventory) {
      const oldAvailable = inventory.available || 0;
      const newAvailable = oldAvailable + quantity;
      
      // Debug log
      console.log(`[recordRepairedReturn] Inventory update:`);
      console.log(`  - deviceId: ${deviceId}`);
      console.log(`  - Before: available = ${oldAvailable}, total = ${inventory.total}`);
      console.log(`  - quantity (đã sửa) = ${quantity}`);
      
      // Tăng số lượng available (thiết bị đã sửa xong)
      // total KHÔNG thay đổi - đây là tổng số thiết bị phòng lab sở hữu
      await Inventory.findByIdAndUpdate(inventory._id, {
        $set: { available: newAvailable },
      });
      
      // Debug log sau khi cập nhật
      console.log(`  - After: available = ${newAvailable} (${oldAvailable} + ${quantity})`);
    } else {
      console.log(`  - ERROR: Inventory not found for deviceId: ${deviceId}, location: lab`);
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tồn kho lab cho thiết bị này",
      });
    }

    // Giảm số lượng trong repairing_items
    // LƯU Ý: KHÔNG cần giảm items[].quantity vì thiết bị hỏng đã được xử lý trong recordReturn
    // Khi trả thiết bị hỏng, item.quantity đã được giảm rồi
    repairingItem.quantity -= quantity;

    // Nếu đã trả hết thiết bị đang sửa, xóa khỏi danh sách
    if (repairingItem.quantity === 0) {
      borrowRecord.repairing_items.splice(repairingItemIndex, 1);
    }

    // Kiểm tra xem còn thiết bị nào chưa trả không
    // QUAN TRỌNG: Chỉ khi hết CẢ items VÀ repairing_items mới được coi là hoàn thành
    const hasRemainingItems = borrowRecord.items.length > 0;
    const hasRemainingRepairing = borrowRecord.repairing_items && borrowRecord.repairing_items.length > 0;

    if (!hasRemainingItems && !hasRemainingRepairing) {
      // Đã trả hết tất cả (cả tốt và đã sửa xong) → "returned"
      borrowRecord.returned = true;
      borrowRecord.status = "returned";
      borrowRecord.return_requested = false;
      returnRecord.status = "done";
      returnRecord.processed_at = new Date();
      await returnRecord.save();
      console.log(`[recordRepairedReturn] Status: returned (đã trả hết tất cả thiết bị)`);
    } else {
      // Vẫn còn thiết bị chưa trả → "return_pending"
      borrowRecord.status = "return_pending";
      borrowRecord.returned = false;
      console.log(`[recordRepairedReturn] Status: return_pending (còn items: ${hasRemainingItems}, repairing: ${hasRemainingRepairing})`);
    }

    await borrowRecord.save();

    // Tạo thông báo cho sinh viên
    try {
      await Notifications.create({
        user_id: borrowRecord.student_id._id,
        type: "success",
        message: `Đã nhận ${quantity} thiết bị đã sửa chữa. Cảm ơn bạn đã hoàn tất việc sửa chữa.`,
      });
    } catch (notifError) {
      console.error("Error creating notification:", notifError);
    }

    return res.status(200).json({
      success: true,
      message: `Ghi nhận trả ${quantity} thiết bị đã sửa chữa thành công`,
      data: {
        borrowRecord,
        returnRecord,
        repairedQuantity: quantity,
      },
    });
  } catch (error) {
    console.error("recordRepairedReturn error:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể ghi nhận trả thiết bị đã sửa",
      error: error.message,
    });
  }
};

