import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const generateAccessToken = (payload) => {
    return jwt.sign(
        { id: payload.id, role: payload.role },
        process.env.ACCESS_TOKEN || "access_secret",
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRE || "15m" }
    );
};

export const generateRefreshToken = (payload) => {
    return jwt.sign(
        { id: payload.id },
        process.env.REFRESH_TOKEN || "refresh_secret",
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRE || "7d" }
    );
};

export const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.REFRESH_TOKEN || "refresh_secret");
};