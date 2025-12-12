import mongoose from "mongoose";

const repairSchema = new mongoose.Schema({
    device_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Device",
        required: true
    },

    reason: {
        type: String,
        required: true
    }, // Lý do hỏng

    image: { type: String, default: null },

    quantity: {
        type: Number,
        default: 1
    },
    inventory_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Inventory",
        required: true,
    },

    status: {
        type: String,
        enum: ["pending", "approved", "in_progress", "done", "rejected"],
        default: "pending"
    }, // mặc định trường phải duyệt
    reason_rejected: { type: String, default: null },

    reviewed_at: { type: Date }, // ngày trường duyệt
    completed_at: { type: Date } // ngày sửa xong

}, { timestamps: true });

export default mongoose.model("Repair", repairSchema);
