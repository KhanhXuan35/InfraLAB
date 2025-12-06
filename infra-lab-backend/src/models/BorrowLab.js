const mongoose = require("mongoose");

const borrowLabSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [{ device_id: String, quantity: Number }],
    return_due_date: Date,
    status: { type: String, default: "approved" },
    returned: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("BorrowLab", borrowLabSchema);
