import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
    action: String,
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    device_id: { type: mongoose.Schema.Types.ObjectId, ref: "Device" },
    quantity: Number,
    related_id: String
}, { timestamps: true });

export default mongoose.model("ActivityLog", activityLogSchema);
