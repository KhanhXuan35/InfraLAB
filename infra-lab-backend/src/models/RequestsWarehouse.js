import mongoose from "mongoose";

const requestsWarehouseSchema = new mongoose.Schema({
    lecturer_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },

    items: [{
        device_id: {
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Device",                       
            required: true
        },
        quantity: Number
    }],

    processed_at: Date
}, { timestamps: true });

export default mongoose.model("RequestsWarehouse", requestsWarehouseSchema);