import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Tạo storage cho multer với Cloudinary
export const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Tạo public_id unique
    const uniqueSuffix = `chat-image-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    
    return {
      folder: "infralab/chat", // Thư mục lưu trữ trên Cloudinary
      allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
      public_id: uniqueSuffix,
      transformation: [
        {
          quality: "auto",
          fetch_format: "auto",
        },
      ],
    };
  },
});

export default cloudinary;

