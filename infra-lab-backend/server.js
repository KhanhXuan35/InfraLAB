import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
import connectDB from "./src/configs/db.js";
import { initializeSocket } from "./src/socket/socketServer.js";
import { createServer } from "http";

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

const startServer = async () => {
  try {
    // Connect Database
    await connectDB();

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.io
    initializeSocket(httpServer);

    // Start Server
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running in ${NODE_ENV} mode at http://localhost:${PORT}`);
      console.log(`🔌 Socket.io server initialized`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};


startServer();
