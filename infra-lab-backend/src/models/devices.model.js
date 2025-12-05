import mongoose from "mongoose";

const DeviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      enum: ["active", "inactive", "broken", "repairing"],
      default: "active"
    },

    // Tham chiếu đến loại thiết bị
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeviceCategory",
      required: true
    }
  },
  {
    timestamps: true // tự động tạo createdAt & updatedAt
  }
);

export default mongoose.model("Device", DeviceSchema, "devices");