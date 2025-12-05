import mongoose from "mongoose";

const DeviceCategorySchema = new mongoose.Schema(
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

    // Tham chiếu đến Kho (inventories)
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true
    }
  },
  {
    timestamps: true // tự tạo createdAt & updatedAt
  }
);

export default mongoose.model("DeviceCategory", DeviceCategorySchema, "device_categories");