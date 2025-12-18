import mongoose from "mongoose";

const requestLabSchema = new mongoose.Schema(
  {
    device_id: { type: mongoose.Schema.Types.ObjectId, ref: "Device", required: true },
    qty: { type: Number, required: true, min: 1 },

    status: {
      type: String,
      enum: ["WAITING", "APPROVED", "REJECTED", "DELIVERED"],
      default: "WAITING",
    },

    // lab manager (hoặc gửi kèm user_id từ FE nếu chưa có middleware auth)
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    created_at: { type: Date, default: Date.now },

    // school admin
    approved_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approved_at: { type: Date },
    
    // Danh sách device instances đã được cấp phát (với serial numbers)
    device_instance_ids: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "DeviceInstance" 
    }],
  },
  {
    timestamps: true,
    collection: "requestswarehouses",
  }
);

export default mongoose.model("RequestLab", requestLabSchema);
