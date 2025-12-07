import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const checkAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "Chưa đăng nhập!" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);

        const user = await User.findById(decoded.id).select("-password -refreshToken");
        if (!user) return res.status(401).json({ success: false, message: "User không tồn tại!" });

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Token hết hạn hoặc không hợp lệ!" });
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: "Không có quyền truy cập!" });
        }
        next();
    };
};