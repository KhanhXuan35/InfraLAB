import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const checkAuthMiddleware = async (req, res, next) => {
    try {
        // Skip auth check for OPTIONS (preflight) requests
        if (req.method === 'OPTIONS') {
            return next();
        }
        
        console.log("🔐 Auth middleware called for:", req.method, req.path);
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            console.log("❌ No auth header");
            return res.status(401).json({ success: false, message: "Chưa đăng nhập!" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);

        const user = await User.findById(decoded.id).select("-password -refreshToken");
        if (!user) {
            console.log("❌ User not found");
            return res.status(401).json({ success: false, message: "User không tồn tại!" });
        }

        console.log("✅ Auth passed for user:", user._id);
        req.user = user;
        next();
    } catch (error) {
        console.log("❌ Auth error:", error.message);
        return res.status(401).json({ success: false, message: "Token hết hạn hoặc không hợp lệ!" });
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        // Skip authorization check for OPTIONS (preflight) requests
        if (req.method === 'OPTIONS') {
            return next();
        }
        
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Chưa đăng nhập!" });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: "Không có quyền truy cập!" });
        }
        next();
    };
};

// Aliases for compatibility
export const verifyToken = checkAuthMiddleware;
export const checkRole = authorize;