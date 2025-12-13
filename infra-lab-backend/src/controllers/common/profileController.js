import User from '../../models/User.js';
import cloudinary from '../../configs/cloudinary.js';

// Lấy upload signature từ Cloudinary
export const getUploadSignature = async (req, res) => {
  try {
    // Kiểm tra các biến môi trường bắt buộc
    const requiredEnvVars = {
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
      CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET,
    };

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([key, value]) => !value || value.includes('your-'))
      .map(([key]) => key);

    if (missingVars.length > 0) {
      return res.status(500).json({
        success: false,
        message: 'Chưa cấu hình Cloudinary. Vui lòng thêm các biến môi trường sau vào file .env: ' + missingVars.join(', '),
        missingVars,
      });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

    // Tạo signature
    const params = {
      timestamp,
      upload_preset: uploadPreset,
    };

    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET
    );

    return res.status(200).json({
      success: true,
      data: {
        timestamp,
        signature,
        uploadPreset,
        apiKey: process.env.CLOUDINARY_API_KEY,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      },
    });
  } catch (error) {
    console.error('Error generating upload signature:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tạo chữ ký upload: ' + error.message,
      error: error.message,
    });
  }
};

// Cập nhật profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, gender, date_of_birth, address, phone, avatar, avatarPublicId } = req.body;

    // Lấy user hiện tại để xử lý avatar cũ
    const currentUser = await User.findById(userId);

    // Tạo object chứa các trường được phép cập nhật
    const updateFields = {};

    if (name !== undefined) updateFields.name = name;
    if (gender !== undefined) {
      if (!['Male', 'Female', 'Other'].includes(gender)) {
        return res.status(400).json({
          success: false,
          message: 'Giới tính không hợp lệ',
        });
      }
      updateFields.gender = gender;
    }
    if (date_of_birth !== undefined) updateFields.date_of_birth = date_of_birth;
    if (address !== undefined) updateFields.address = address;
    if (phone !== undefined) updateFields.phone = phone;
    if (avatar !== undefined) updateFields.avatar = avatar;

    // Nếu có avatar mới và có avatar cũ, xóa avatar cũ trên Cloudinary
    if (avatar && avatarPublicId) {
      if (currentUser?.avatarPublicId && currentUser.avatarPublicId !== avatarPublicId) {
        try {
          await cloudinary.uploader.destroy(currentUser.avatarPublicId);
        } catch (error) {
          console.error('Error deleting old avatar:', error);
          // Không throw error, chỉ log để không làm gián đoạn quá trình cập nhật
        }
      }
    }

    // Nếu yêu cầu xóa avatar (avatar rỗng/null) và đang có avatar cũ, xóa trên Cloudinary
    if ((avatar === '' || avatar === null) && currentUser?.avatarPublicId) {
      try {
        await cloudinary.uploader.destroy(currentUser.avatarPublicId);
      } catch (error) {
        console.error('Error deleting old avatar:', error);
      }
      updateFields.avatar = '';
      updateFields.avatarPublicId = null;
    }

    // Lưu avatarPublicId nếu có
    if (avatarPublicId !== undefined) updateFields.avatarPublicId = avatarPublicId;

    // Cập nhật user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password -refreshToken -emailToken');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể cập nhật thông tin',
      error: error.message,
    });
  }
};

// Lấy thông tin profile hiện tại
export const getProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('-password -refreshToken -emailToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin người dùng',
      error: error.message,
    });
  }
};

