import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },            
    email: { type: String, required: true, unique: true },
    name: String,
    gender: { type: String, enum: ["Male", "Female", "Other"], default: "Other" },
    date_of_birth: Date,
    address: String,
    avatar: { type: String, default: "" },
    role: {
        type: String,
        enum: ["student", "lab_manager", "school_admin"],
        required: true
    },
    isActive: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    student_code: String,
    phone: String,
    emailToken: { type: String, default: null },
    refreshToken: { type: String, default: null },
}, { timestamps: true });

export default mongoose.model("User", userSchema);