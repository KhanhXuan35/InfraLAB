import express from "express";
import cors from "cors";
import morgan from "morgan";
import inventoryRoutes from "./routes/LabManager/inventoryRoutes.js";
import categoryRoutes from "./routes/LabManager/categoryRoutes.js";

const app = express();

app.use(cors()); // nếu cần thì cấu hình origin cho FE
app.use(express.json());
app.use(morgan("dev"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Inventory routes
app.use("/api/inventory", inventoryRoutes);
app.use("/api/categories", categoryRoutes);
export default app;
