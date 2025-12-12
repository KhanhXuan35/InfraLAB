import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Upload,
  Button,
  Avatar,
  message,
  Space,
  Spin,
} from 'antd';
import {
  UserOutlined,
  UploadOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';

const { Option } = Select;

const EditProfile = ({ visible, onCancel, onSuccess, user }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [avatarPublicId, setAvatarPublicId] = useState(user?.avatarPublicId || null);
  const [fileList, setFileList] = useState([]);

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
    setAvatarPublicId(null);
    setFileList([]);
    message.info('Đã xóa ảnh đại diện (chưa lưu). Nhấn "Lưu thay đổi" để áp dụng.');
  };

  useEffect(() => {
    if (visible && user) {
      form.setFieldsValue({
        name: user.name || '',
        gender: user.gender || 'Other',
        date_of_birth: user.date_of_birth ? dayjs(user.date_of_birth) : null,
        address: user.address || '',
        phone: user.phone || '',
      });
      setAvatarUrl(user.avatar || '');
      setAvatarPublicId(user.avatarPublicId || null);
      setFileList([]);
    }
  }, [visible, user, form]);

  // Xử lý upload avatar lên Cloudinary
  const handleAvatarUpload = async (file) => {
    try {
      setUploading(true);

      // Kiểm tra kích thước file (tối đa 2MB)
      if (file.size > 2 * 1024 * 1024) {
        message.error('Kích thước ảnh không được vượt quá 2MB');
        return false;
      }

      // Kiểm tra loại file
      if (!file.type.startsWith('image/')) {
        message.error('Chỉ chấp nhận file ảnh');
        return false;
      }

      // Lấy upload signature từ backend
      const signatureResponse = await api.post('/profile/upload-signature');
      
      if (!signatureResponse.success) {
        throw new Error(signatureResponse.message || 'Không thể lấy chữ ký upload');
      }
      
      const signatureData = signatureResponse.data;

      // Kiểm tra các trường bắt buộc
      if (!signatureData.apiKey || !signatureData.cloudName || !signatureData.signature) {
        throw new Error('Thiếu thông tin cấu hình Cloudinary. Vui lòng kiểm tra file .env');
      }

      // Upload lên Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signatureData.apiKey);
      formData.append('timestamp', signatureData.timestamp);
      formData.append('signature', signatureData.signature);
      formData.append('upload_preset', signatureData.uploadPreset);

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!cloudinaryResponse.ok) {
        const errorData = await cloudinaryResponse.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Upload thất bại (${cloudinaryResponse.status})`);
      }

      const cloudinaryData = await cloudinaryResponse.json();
      
      if (!cloudinaryData.secure_url) {
        throw new Error('Không nhận được URL ảnh từ Cloudinary');
      }

      // Lưu URL và public_id
      setAvatarUrl(cloudinaryData.secure_url);
      setAvatarPublicId(cloudinaryData.public_id);

      message.success('Upload avatar thành công!');
      return false; // Ngăn không cho Upload component tự động upload
    } catch (error) {
      console.error('Error uploading avatar:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi không xác định';
      message.error('Upload avatar thất bại: ' + errorMessage);
      
      // Nếu lỗi liên quan đến cấu hình Cloudinary, hiển thị hướng dẫn
      if (errorMessage.includes('Cloudinary') || errorMessage.includes('.env')) {
        console.error('⚠️ Vui lòng kiểm tra cấu hình Cloudinary trong file .env');
        console.error('Xem hướng dẫn trong file CLOUDINARY_SETUP.md');
      }
      
      return false;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const updateData = {
        name: values.name,
        gender: values.gender,
        date_of_birth: values.date_of_birth ? values.date_of_birth.toISOString() : null,
        address: values.address,
        phone: values.phone,
      };

      // Nếu có avatar mới, thêm vào updateData
      if (avatarUrl && avatarUrl !== user?.avatar) {
        updateData.avatar = avatarUrl;
        updateData.avatarPublicId = avatarPublicId;
    } else if (!avatarUrl && user?.avatar) {
      // Xóa avatar hiện tại
      updateData.avatar = '';
      updateData.avatarPublicId = null;
      }

      const response = await api.put('/profile', updateData);

      if (response.success) {
        message.success('Cập nhật thông tin thành công!');
        
        // Cập nhật localStorage
        const updatedUser = { ...user, ...response.data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Dispatch event để Header cập nhật avatar
        window.dispatchEvent(new Event('userUpdated'));
        
        onSuccess(updatedUser);
        onCancel();
      } else {
        throw new Error(response.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error(error.message || 'Cập nhật thông tin thất bại');
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    beforeUpload: handleAvatarUpload,
    fileList,
    onRemove: () => {
      setFileList([]);
      setAvatarUrl(user?.avatar || '');
      setAvatarPublicId(user?.avatarPublicId || null);
    },
    onChange: ({ fileList: newFileList }) => {
      setFileList(newFileList);
    },
    maxCount: 1,
    accept: 'image/*',
  };

  return (
    <Modal
      title="Chỉnh sửa thông tin cá nhân"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ marginTop: 24 }}
      >
        {/* Avatar Upload */}
        <Form.Item label="Ảnh đại diện">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <Avatar
              size={120}
              src={avatarUrl || null}
              icon={!avatarUrl && <UserOutlined />}
              style={{ backgroundColor: '#1890ff' }}
            >
              {!avatarUrl && (user?.name?.charAt(0) || 'U')}
            </Avatar>
            <Upload {...uploadProps}>
              <Button
                icon={uploading ? <LoadingOutlined /> : <UploadOutlined />}
                loading={uploading}
                disabled={uploading}
              >
                {uploading ? 'Đang upload...' : 'Chọn ảnh đại diện'}
              </Button>
            </Upload>
            <Button
              danger
              type="text"
              onClick={handleRemoveAvatar}
              disabled={!avatarUrl && !user?.avatar}
            >
              Xóa ảnh đại diện
            </Button>
            <div style={{ fontSize: 12, color: '#8c8c8c', textAlign: 'center' }}>
              Chỉ chấp nhận file ảnh (JPG, PNG, WEBP), tối đa 2MB
            </div>
          </div>
        </Form.Item>

        {/* Họ và tên */}
        <Form.Item
          label="Họ và tên"
          name="name"
          rules={[
            { required: true, message: 'Vui lòng nhập họ và tên' },
            { max: 100, message: 'Họ và tên không được vượt quá 100 ký tự' },
          ]}
        >
          <Input placeholder="Nhập họ và tên" />
        </Form.Item>

        {/* Giới tính */}
        <Form.Item
          label="Giới tính"
          name="gender"
          rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}
        >
          <Select placeholder="Chọn giới tính">
            <Option value="Male">Nam</Option>
            <Option value="Female">Nữ</Option>
            <Option value="Other">Khác</Option>
          </Select>
        </Form.Item>

        {/* Ngày sinh */}
        <Form.Item
          label="Ngày sinh"
          name="date_of_birth"
        >
          <DatePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            placeholder="Chọn ngày sinh"
            disabledDate={(current) => current && current > dayjs().endOf('day')}
          />
        </Form.Item>

        {/* Địa chỉ */}
        <Form.Item
          label="Địa chỉ"
          name="address"
          rules={[{ max: 200, message: 'Địa chỉ không được vượt quá 200 ký tự' }]}
        >
          <Input.TextArea
            rows={3}
            placeholder="Nhập địa chỉ"
            showCount
            maxLength={200}
          />
        </Form.Item>

        {/* Số điện thoại */}
        <Form.Item
          label="Số điện thoại"
          name="phone"
          rules={[
            { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ' },
          ]}
        >
          <Input placeholder="Nhập số điện thoại" />
        </Form.Item>

        {/* Buttons */}
        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel} disabled={loading}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Lưu thay đổi
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditProfile;

