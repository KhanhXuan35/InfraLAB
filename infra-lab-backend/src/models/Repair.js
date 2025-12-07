import mongoose from "mongoose";

const repairSchema = new mongoose.Schema({
    device_id: { type: mongoose.Schema.Types.ObjectId, ref: "Device", required: true },
    quantity: Number,
    status: { type: String, enum: ["pending", "done"], default: "pending" },
    completed_at: Date
}, { timestamps: true });

export default mongoose.model("Repair", repairSchema);
