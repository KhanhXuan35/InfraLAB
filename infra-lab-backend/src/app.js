import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import inventoryRoutes from "./routes/device_school/inventories.routes.js";
import deviceCategoryRoutes from "./routes/device_school/device_categories.routes.js";
import deviceRoutes from "./routes/device_school/devices.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", routes);
app.use("/api/inventories", inventoryRoutes);
app.use("/api/device-categories", deviceCategoryRoutes);
app.use("/api/devices", deviceRoutes);

export default app;
