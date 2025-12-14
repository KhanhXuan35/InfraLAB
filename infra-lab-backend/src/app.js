import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import routes from "./routes/index.js";
import inventoryRoutes from "./routes/LabManager/inventoryRoutes.js";
import categoryRoutes from "./routes/LabManager/categoryRoutes.js";
import detailDevice from "./routes/LabManager/detailDevice.js";
import dashboardRoutes from "./routes/LabManager/dashboardRoutes.js";
import requestLabRoutes from "./routes/LabManager/requestLabRoutes.js";
import schoolDashboardRoutes from "./routes/School/schoolDashboardRoutes.js";
import userDashboardRoutes from "./routes/User/userDashboardRoutes.js";
import schoolInventoryRoutes from "./routes/device_school/inventories.routes.js";
import deviceCategoryRoutes from "./routes/device_school/device_categories.routes.js";
import deviceRoutes from "./routes/device_school/devices.routes.js";
import repairRoutes from "./routes/LabManager/repairRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import borrowRoutes from "./routes/borrowRoutes.js";
import borrowReturnRoutes from "./routes/LabManager/borrowReturnRoutes.js";
import { uploadImage, uploadSingle } from "./controllers/common/uploadController.js";
import { checkAuthMiddleware } from "./middlewares/authMiddleware.js";
import path from "path";
import { fileURLToPath } from "url";
import userRoutes from "./routes/LabManager/userRoutes.js";
const app = express();

app.use((req, res, next) => {
    console.log(`[DEBUG 1] Request vào server: ${req.method} ${req.url}`);
    next();
});

// 1. Cấu hình CORS (Quan trọng để nhận Cookie)
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173", // URL frontend của bạn
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Thêm PATCH để hỗ trợ cập nhật trạng thái
    credentials: true // <--- Bắt buộc để browser cho phép lưu cookie
}));

// Upload routes - đặt TRƯỚC express.json() và express.urlencoded() 
// vì multer cần xử lý multipart/form-data
app.post("/api/upload/image", (req, res, next) => {
  console.log("🔍 [UPLOAD ROUTE] Request received:", {
    method: req.method,
    path: req.path,
    url: req.url,
    hasAuth: !!req.headers.authorization,
    contentType: req.headers["content-type"],
  });
  next();
}, checkAuthMiddleware, uploadSingle, uploadImage);

// Test route để kiểm tra
app.get("/api/upload/test", (req, res) => {
  res.json({ message: "Upload route is working", path: "/api/upload/image" });
});

console.log("✅ Upload route registered: POST /api/upload/image");
console.log("✅ Upload test route registered: GET /api/upload/test");

// 2. Middleware xử lý dữ liệu
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); 
app.use(morgan("dev"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});
console.log("DETAIL DEVICE ROUTE LOADED");

// Serve static files (uploads)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 3. Routes
app.use("/api/inventories", schoolInventoryRoutes);
app.use("/api/device-categories", deviceCategoryRoutes);
app.use("/api/devices", deviceRoutes);

// Lab Manager routes
app.use("/api/inventory", inventoryRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/device-detail", detailDevice);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/request-lab", requestLabRoutes);

// School Dashboard routes
app.use("/api/school-dashboard", schoolDashboardRoutes);

// User Dashboard routes
app.use("/api/user-dashboard", userDashboardRoutes);

// School device management routes
app.use("/api/inventories", schoolInventoryRoutes);
app.use("/api/device-categories", deviceCategoryRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/borrow", borrowRoutes);

// Repair routes
app.use("/api/repairs", repairRoutes);

app.use("/api", routes);

// Lab Manager Borrow/Return routes
app.use("/api/lab-manager/borrow-return", borrowReturnRoutes);

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
