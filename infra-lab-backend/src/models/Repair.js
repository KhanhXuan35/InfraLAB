import mongoose from "mongoose";

const repairSchema = new mongoose.Schema({
    // ===== THIẾT BỊ CỤ THỂ CẦN SỬA =====
    device_instance_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DeviceInstance",
        default: null  // null nếu là repair cũ (chưa có DeviceInstance)
    },
    // Lưu lại serial để query/hiển thị nhanh, phòng trường hợp sau này xoá instance
    serial_number: {
        type: String,
        default: null
    },
    
    // ===== GIỮ LẠI CHO COMPATIBILITY VỚI DỮ LIỆU CŨ =====
    device_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Device",
        required: true
    },
    quantity: {
        type: Number,
        default: 1
    },
    inventory_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Inventory",
        default: null
    },

    // ===== THÔNG TIN SỬA CHỮA =====
    reason: {
        type: String,
        required: true
    }, // Lý do hỏng
    
    broken_parts: [{ type: String }], // Các bộ phận hỏng
    
    image: { type: String, default: null },
    images_before: [{ type: String }], // Ảnh trước khi sửa
    images_after: [{ type: String }], // Ảnh sau khi sửa

    // ===== PHÂN LOẠI SỬA CHỮA =====
    repair_type: {
        type: String,
        enum: ["warranty", "paid", "internal"],
        default: "internal"
    }, // warranty: bảo hành, paid: student trả phí, internal: tự sửa
    
    // ===== NGƯỜI BÁO CÁO & SỬA CHỮA =====
    reported_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    repaired_by: { type: String, default: null }, // Tên người/cửa hàng sửa
    repair_shop: { type: String, default: null }, // Địa chỉ cửa hàng sửa
    
    // ===== CHI PHÍ =====
    estimated_repair_cost: { type: Number, default: 0 },
    actual_repair_cost: { type: Number, default: 0 },
    compensation_required: { type: Boolean, default: false }, // Student phải bồi thường?
    
    // ===== TRẠNG THÁI =====
    status: {
        type: String,
        enum: ["pending", "approved", "in_progress", "done", "rejected", "cannot_repair"],
        default: "pending"
    },
    reason_rejected: { type: String, default: null },

    reviewed_at: { type: Date },
    completed_at: { type: Date }

}, { timestamps: true });

export default mongoose.model("Repair", repairSchema);
