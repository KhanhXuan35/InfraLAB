import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Form, Input, Button, Typography, notification } from "antd";
import { MailOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { requestPasswordReset } from "../services/authService"; // Import service
import { ROUTES } from "../constants/routes";
import "../App.css";

const { Title, Text } = Typography;

const ForgotPasswordPage = () => {
  const [api, contextHolder] = notification.useNotification();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await requestPasswordReset(values.email);
      if (res.success) {
        api.success({
          message: "Đã gửi email!",
          description: "Vui lòng kiểm tra hộp thư của bạn để lấy liên kết đặt lại mật khẩu.",
          placement: "topRight",
        });
      }
    } catch (error) {
      api.error({
        message: "Gửi yêu cầu thất bại",
        description: error.message || "Không tìm thấy email này trong hệ thống.",
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
          <Title level={3} style={{ margin: 0, color: "#333" }}>Quên Mật Khẩu?</Title>
          <Text type="secondary">Nhập email của bạn để nhận liên kết đặt lại mật khẩu.</Text>
        </div>

        {/* Form */}
        <Form
          name="forgot_password"
          layout="vertical"
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email!" },
              { type: "email", message: "Email không hợp lệ!" }
            ]}
          >
            <Input 
              prefix={<MailOutlined style={{ color: "rgba(0,0,0,.25)" }} />} 
              placeholder="Nhập địa chỉ email của bạn" 
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
                backgroundColor: "#F36F21", // Màu cam FPT cho nút hành động
                borderColor: "#F36F21", 
                height: "48px", 
                fontSize: "16px",
                fontWeight: "bold",
                borderRadius: "8px"
              }}
            >
              Gửi liên kết xác nhận
            </Button>
          </Form.Item>
        </Form>

        {/* Footer Link */}
        <div style={{ textAlign: "center", marginTop: "10px" }}>
          <Link to={ROUTES.LOGIN} style={{ color: "#555", display: "inline-flex", alignItems: "center", gap: "5px" }}>
            <ArrowLeftOutlined /> Quay lại trang đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;