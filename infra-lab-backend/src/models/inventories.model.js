import mongoose from "mongoose";

const InventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true // tạo createdAt & updatedAt
  }
);

export default mongoose.model("Inventory", InventorySchema, "inventories");
