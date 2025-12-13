import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Form, Input, Button, Typography, notification } from "antd";
import { LockOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { resetPassword } from "../services/authService"; // Import service
import { ROUTES } from "../constants/routes";
import "../App.css";

const { Title, Text } = Typography;

const ResetPasswordPage = () => {
  const { token } = useParams(); // Lấy token từ URL
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await resetPassword(token, values.newPassword);
      if (res.success) {
        api.success({
          message: "Thành công!",
          description: "Mật khẩu đã được đặt lại. Đang chuyển hướng...",
          duration: 2,
        });
        setTimeout(() => navigate(ROUTES.LOGIN), 2000);
      }
    } catch (error) {
      api.error({
        message: "Lỗi",
        description: error.message || "Token không hợp lệ hoặc đã hết hạn.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
    }}>
      {contextHolder}
      
      <div className="auth-card" style={{
        background: "white", borderRadius: "12px", padding: "40px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.1)", width: "100%", maxWidth: "500px"
      }}>
        {/* Header */}
        <div className="logo-section" style={{ textAlign: "center", marginBottom: "30px" }}>
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/FPT_Education_logo.svg/960px-FPT_Education_logo.svg.png" 
            alt="FPT Logo" 
            style={{ height: '50px', marginBottom: '15px' }}
          />
          <Title level={3} style={{ margin: 0, color: "#333" }}>Đặt Lại Mật Khẩu</Title>
          <Text type="secondary">Vui lòng nhập mật khẩu mới cho tài khoản của bạn.</Text>
        </div>

        {/* Form */}
        <Form
          name="reset_password"
          layout="vertical"
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            label="Mật khẩu mới"
            name="newPassword"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu mới!" },
              { min: 8, message: "Mật khẩu phải có ít nhất 8 ký tự!" },
              { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/, message: "Cần chữ hoa, thường, số và ký tự đặc biệt!" }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
              placeholder="Nhập mật khẩu mới"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Hai mật khẩu không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<CheckCircleOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
              placeholder="Nhập lại mật khẩu mới"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

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
                fontSize: "16px",
                fontWeight: "bold",
                borderRadius: "8px"
              }}
            >
              Cập nhật mật khẩu
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;