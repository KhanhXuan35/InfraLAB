import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: String, // "borrow_approved", "borrow_rejected", "borrow_delivered", etc.
    message: String,
    read: { type: Boolean, default: false },
    // Thêm fields để link đến request/certificate
    related_id: { type: mongoose.Schema.Types.ObjectId }, // ID của request hoặc certificate
    related_type: { type: String }, // "RequestLab", "Certificate", etc.
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);
