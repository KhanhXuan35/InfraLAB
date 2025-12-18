import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
  {
    request_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "RequestLab", 
      required: true 
    },
    
    // Thông tin yêu cầu
    device_id: { type: mongoose.Schema.Types.ObjectId, ref: "Device" },
    qty: { type: Number, required: true },
    
    // Người yêu cầu (Lab Manager)
    requester_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    requester_name: String,
    requester_email: String,
    requester_role: { type: String, default: "lab_manager" },
    
    // Người duyệt (School Admin)
    approver_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approver_name: String,
    
    // Trạng thái chứng nhận
    status: {
      type: String,
      enum: ["APPROVED", "REJECTED"],
      required: true,
    },
    
    // Thời gian
    approved_at: Date,
    rejected_at: Date,
    
    // Serial numbers đã được cấp (nếu approved)
    device_instance_ids: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "DeviceInstance" 
    }],
    
    // Ghi chú
    note: String,
    
    // Mã chứng nhận (unique)
    certificate_code: {
      type: String,
      unique: true,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "certificates",
  }
);

// Tạo index cho certificate_code
certificateSchema.index({ certificate_code: 1 });
certificateSchema.index({ request_id: 1 });
certificateSchema.index({ requester_id: 1 });

export default mongoose.model("Certificate", certificateSchema);

