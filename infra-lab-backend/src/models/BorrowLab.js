import mongoose from "mongoose";

const borrowLabSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    items: [{
        device_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Device",                     
            required: true
        },
        quantity: { type: Number, required: true, min: 1 }
    }],

    return_due_date: { type: Date, required: true },
    purpose: { type: String, required: true, maxlength: 500 },
    notes: { type: String, maxlength: 1000 },
    status: { 
      type: String, 
      enum: ["borrowed", "return_pending", "returned"], 
      default: "borrowed" 
    },
    returned: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("BorrowLab", borrowLabSchema);