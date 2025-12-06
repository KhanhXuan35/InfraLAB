import mongoose from "mongoose";

const returnLabSchema = new mongoose.Schema({
    borrow_id: { type: mongoose.Schema.Types.ObjectId, ref: "BorrowLab", required: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    items: [{
        device_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Device",                       
            required: true
        },
        quantity: Number,
        broken: Number
    }],

    status: { type: String, enum: ["pending_check", "done"], default: "pending_check" },
    processed_at: Date
}, { timestamps: true });

export default mongoose.model("ReturnLab", returnLabSchema);