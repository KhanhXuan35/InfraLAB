const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, required: true },
    password_hash: { type: String, required: true },

    role: {
        type: String,
        enum: ["student", "lab_manager", "school_admin"],
        required: true
    },

    student_code: String,
    phone: String,
    avatar: String,
    verified: { type: Boolean, default: false },
    status: { type: String, default: "active" }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
