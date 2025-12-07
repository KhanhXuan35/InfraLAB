import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes/index.js";

const app = express();

// 1. Cấu hình CORS (Quan trọng để nhận Cookie)
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173", // URL frontend của bạn
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true // <--- Bắt buộc để browser cho phép lưu cookie
}));

// 2. Middleware xử lý dữ liệu
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // <--- Middleware đọc/ghi cookie

// 3. Routes
app.use("/api", routes);

// 4. Xử lý lỗi 404 (Không tìm thấy route)
app.use((req, res, next) => {
    const error = new Error("Not Found");
    error.status = 404;
    next(error);
});

// 5. Middleware xử lý lỗi tập trung
app.use((error, req, res, next) => {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
        status: statusCode,
        success: false,
        message: error.message || "Internal Server Error"
    });
});

export default app;