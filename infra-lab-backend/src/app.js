import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes/index.js";
import inventoryRoutes from "./routes/LabManager/inventoryRoutes.js";
import categoryRoutes from "./routes/LabManager/categoryRoutes.js";
import detailDevice from "./routes/LabManager/detailDevice.js";
import dashboardRoutes from "./routes/LabManager/dashboardRoutes.js";
import schoolDashboardRoutes from "./routes/School/schoolDashboardRoutes.js";
import userDashboardRoutes from "./routes/User/userDashboardRoutes.js";
import schoolInventoryRoutes from "./routes/device_school/inventories.routes.js";
import deviceCategoryRoutes from "./routes/device_school/device_categories.routes.js";
import deviceRoutes from "./routes/device_school/devices.routes.js";

const app = express();

app.use(cors()); // nếu cần thì cấu hình origin cho FE
app.use(express.json());
app.use(morgan("dev"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});
console.log("DETAIL DEVICE ROUTE LOADED");

// General routes
app.use("/api", routes);

// Lab Manager routes
app.use("/api/inventory", inventoryRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/device-detail", detailDevice);
app.use("/api/dashboard", dashboardRoutes);

// School Dashboard routes
app.use("/api/school-dashboard", schoolDashboardRoutes);

// User Dashboard routes
app.use("/api/user-dashboard", userDashboardRoutes);

// School device management routes
app.use("/api/inventories", schoolInventoryRoutes);
app.use("/api/device-categories", deviceCategoryRoutes);
app.use("/api/devices", deviceRoutes);

export default app;
