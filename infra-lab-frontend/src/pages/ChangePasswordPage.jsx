import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Typography, notification, Breadcrumb } from "antd";
import { LockOutlined, SafetyCertificateOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { changePassword } from "../services/authService";
import "../App.css"; // Tận dụng CSS cũ

const { Title, Text } = Typography;

const ChangePasswordPage = () => {
  const [api, contextHolder] = notification.useNotification();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm(); // Hook để reset form sau khi thành công

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword
      });

      if (res.success) {
        api.success({
          message: "Thành công!",
          description: "Mật khẩu đã được thay đổi. Email xác nhận đang được gửi tới bạn.",
          duration: 3,
        });
        form.resetFields(); // Xóa trắng form
        // Tùy chọn: Đăng xuất bắt đăng nhập lại hoặc giữ nguyên
      }
    } catch (error) {
      // Xử lý lỗi từ Backend trả về
      const errorMsg = error.response?.data?.message || error.message;
      
      api.error({
        message: "Đổi mật khẩu thất bại",
        description: errorMsg,
      });

      // Nếu lỗi là do Token hết hạn (401), đẩy về Login
      if (error.response?.status === 401) {
          navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      background: "#f0f2f5", 
      minHeight: "100vh", 
      padding: "20px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}>
      {contextHolder}

      <div style={{ 
        background: "white", 
        padding: "40px", 
        borderRadius: "12px", 
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        width: "100%",
        maxWidth: "500px"
      }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <SafetyCertificateOutlined style={{ fontSize: "48px", color: "#F36F21" }} />
          <Title level={3} style={{ marginTop: "10px", color: "#333" }}>Đổi Mật Khẩu</Title>
          <Text type="secondary">Để bảo mật, vui lòng đặt mật khẩu mạnh (gồm chữ hoa, thường, số và ký tự đặc biệt).</Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          size="large"
        >
          {/* Mật khẩu cũ */}
          <Form.Item
            label="Mật khẩu hiện tại"
            name="oldPassword"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu cũ!" }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Nhập mật khẩu cũ của bạn" 
            />
          </Form.Item>

          {/* Mật khẩu mới */}
          <Form.Item
            label="Mật khẩu mới"
            name="newPassword"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu mới!" },
              { min: 8, max: 15, message: "Mật khẩu từ 8-15 ký tự" },
              { 
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,15}$/, 
                message: "Mật khẩu phải có chữ Hoa, thường, số và ký tự đặc biệt!" 
              },
              // Validate không trùng mật khẩu cũ ngay trên Frontend (Optional)
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (value && value === getFieldValue('oldPassword')) {
                    return Promise.reject(new Error('Mật khẩu mới không được trùng với mật khẩu cũ!'));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Nhập mật khẩu mới" 
            />
          </Form.Item>

          {/* Xác nhận mật khẩu */}
          <Form.Item
            label="Xác nhận mật khẩu mới"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Nhập lại mật khẩu mới" 
            />
          </Form.Item>

          {/* Nút Submit */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{ 
                backgroundColor: "#333", 
                borderColor: "#333", 
                height: "48px", 
                fontWeight: "bold"
              }}
            >
              Cập nhật mật khẩu
            </Button>
          </Form.Item>
        </Form>

        {/* Nút quay lại Dashboard */}
        <div style={{ textAlign: "center", marginTop: "10px" }}>
            <Button 
                type="link" 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate(-1)} // Quay lại trang trước đó (Dashboard)
                style={{ color: "#666" }}
            >
                Quay lại
            </Button>
        </div>

      </div>
    </div>
  );
};

export default ChangePasswordPage;