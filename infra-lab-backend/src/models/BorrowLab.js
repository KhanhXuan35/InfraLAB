import mongoose from "mongoose";

const borrowLabSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    items: [{
        device_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Device",                     
            required: true
        },
        quantity: { type: Number, required: true, min: 1 },
        // ===== THÊM: Array chứa các device instance cụ thể đã được assign =====
        device_instances: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "DeviceInstance"
        }]
    }],

    // Thiết bị hỏng đang được sinh viên sửa chữa
    repairing_items: [{
        device_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Device",
            required: true
        },
        quantity: { type: Number, required: true, min: 1 },
        broken_reason: { type: String, required: true },
        reported_at: { type: Date, default: Date.now }
    }],

    return_due_date: { type: Date, required: true },
    purpose: { type: String, required: true, maxlength: 500 },
    notes: { type: String, maxlength: 1000 },
    status: { 
      type: String, 
      enum: ["pending", "approved", "rejected", "borrowed", "return_pending", "returned", "return_requested", "pending_compensation"], 
      default: "pending" 
    },
    approved_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    approved_at: { type: Date, default: null },
    rejected_reason: { type: String, default: null },
    returned: { type: Boolean, default: false },
    return_requested: { type: Boolean, default: false },
    return_requested_at: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model("BorrowLab", borrowLabSchema);