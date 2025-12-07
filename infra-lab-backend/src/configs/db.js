import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || process.env.DB_CONNECT;
    const dbName = (process.env.DB_NAME || "InfraLab").trim();

    if (!uri) throw new Error("Missing MongoDB connection string (DB_CONNECT or MONGODB_URI)");

    const conn = await mongoose.connect(uri, { dbName });

    console.log(`✅ MongoDB Connected | DB: ${conn.connection.name}`);

    // In tất cả collections
    const collections = await conn.connection.db.listCollections().toArray();
    console.log("📦 Collections:", collections.map(c => c.name));

    return conn;
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

export default connectDB; // <-- export chuẩn ESM
