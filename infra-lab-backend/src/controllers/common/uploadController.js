import multer from "multer";
import { storage } from "../../configs/cloudinary.config.js";

// Filter chỉ cho phép ảnh
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(file.originalname.toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Chỉ cho phép upload file ảnh (jpeg, jpg, png, gif, webp)"));
  }
};

// Cấu hình multer với Cloudinary storage - không giới hạn file size
const upload = multer({
  storage: storage,
  limits: {
    fileSize: Infinity, // Không giới hạn kích thước (Cloudinary sẽ xử lý)
  },
  fileFilter: fileFilter,
});

// Middleware upload single file với error handling
export const uploadSingle = (req, res, next) => {
  console.log("📎 [MULTER] Middleware called");
  console.log("📎 [MULTER] Content-Type:", req.headers["content-type"]);
  console.log("📎 [MULTER] Has body:", !!req.body);
  
  upload.single("image")(req, res, (err) => {
    if (err) {
      console.error("❌ [MULTER] Error:", err);
      // Xử lý lỗi từ multer
      if (err instanceof multer.MulterError) {
        console.error("❌ [MULTER] MulterError code:", err.code);
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File quá lớn",
          });
        }
      }
      return res.status(400).json({
        success: false,
        message: err.message || "Lỗi khi upload file",
      });
    }
    console.log("✅ [MULTER] Success, file:", req.file ? {
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path,
    } : "No file");
    next();
  });
};

// Controller xử lý upload
export const uploadImage = async (req, res) => {
  try {
    console.log("📤 Upload image request received");
    console.log("File:", req.file);
    
    if (!req.file) {
      console.log("❌ No file in request");
      return res.status(400).json({
        success: false,
        message: "Không có file được upload",
      });
    }

    // Cloudinary trả về URL trong req.file.path (multer-storage-cloudinary)
    // path sẽ chứa secure URL từ Cloudinary
    const imageUrl = req.file.path;

    if (!imageUrl) {
      console.log("❌ No image URL from Cloudinary");
      console.log("File object:", JSON.stringify(req.file, null, 2));
      return res.status(500).json({
        success: false,
        message: "Không thể lấy URL ảnh từ Cloudinary",
      });
    }

    console.log("✅ Image uploaded successfully to Cloudinary:", imageUrl);

    res.status(200).json({
      success: true,
      imageUrl: imageUrl,
      filename: req.file.filename || req.file.originalname,
      originalName: req.file.originalname,
      size: req.file.size,
      publicId: req.file.public_id, // Cloudinary public ID
    });
  } catch (error) {
    console.error("❌ Error uploading image:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi upload ảnh",
    });
  }
};
