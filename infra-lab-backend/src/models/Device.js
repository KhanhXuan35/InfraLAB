import mongoose from "mongoose";

const deviceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model("Device", deviceSchema);
