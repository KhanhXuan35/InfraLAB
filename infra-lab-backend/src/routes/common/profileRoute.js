import express from 'express';
import { checkAuthMiddleware } from '../../middlewares/authMiddleware.js';
import {
  getProfile,
  updateProfile,
  getUploadSignature,
} from '../../controllers/common/profileController.js';

const router = express.Router();

// Tất cả routes đều yêu cầu authentication
router.use(checkAuthMiddleware);

// Lấy thông tin profile
router.get('/', getProfile);

// Cập nhật profile
router.put('/', updateProfile);

// Lấy upload signature cho Cloudinary
router.post('/upload-signature', getUploadSignature);

export default router;

