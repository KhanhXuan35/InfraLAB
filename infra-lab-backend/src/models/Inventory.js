import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
    device_id: { type: mongoose.Schema.Types.ObjectId, ref: "Device", required: true },
    location: { type: String, enum: ["warehouse", "lab"], required: true },
    total: Number,
    available: Number,
    broken: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("Inventory", inventorySchema);
