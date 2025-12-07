import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Form, Input, Button, Typography, notification, Divider } from "antd";
import { GoogleLogin } from "@react-oauth/google";
import { EyeInvisibleOutlined, EyeTwoTone, UserOutlined, LockOutlined } from "@ant-design/icons";
import { login, googleLogin } from "../services/authService";
import { ROUTES } from "../constants/routes";
import "../App.css"; // Đảm bảo bạn đã có file CSS này

const { Title, Text } = Typography;

const LoginPage = () => {
  const [api, contextHolder] = notification.useNotification();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // --- HÀM XỬ LÝ CHUNG: LƯU TOKEN & CHUYỂN HƯỚNG ---
  const handleLoginSuccess = (data) => {
    // 1. Lưu thông tin quan trọng vào LocalStorage
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("user", JSON.stringify(data.data)); // data.data chứa { id, name, role, avatar... }

    // 2. Hiển thị thông báo chào mừng
    api.success({
      message: "Đăng nhập thành công",
      description: `Chào mừng ${data.data.name || "bạn"} quay trở lại hệ thống! 🎉`,
      placement: "topRight",
      duration: 2,
    });

    // 3. Phân quyền chuyển hướng (Routing)
    const role = data.data.role; // Lấy role từ backend trả về

    setTimeout(() => {
      switch (role) {
        case "student":
          navigate("/user-dashboard"); // Trang dành cho Sinh viên
          break;
        case "lab_manager":
          navigate("/teacher-dashboard"); // Trang dành cho Quản lý Lab/Giáo viên
          break;
        case "school_admin":
          navigate("/school-dashboard"); // Trang dành cho Admin trường
          break;
        default:
          navigate("/"); // Mặc định nếu không xác định được role
      }
    }, 1000); // Đợi 1s để người dùng kịp đọc thông báo
  };

  // --- XỬ LÝ ĐĂNG NHẬP BẰNG FORM (Username/Pass) ---
  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Gọi API login từ authService
      const res = await login(values);
      
      if (res.success) {
        handleLoginSuccess(res);
      }
    } catch (error) {
      api.error({
        message: "Đăng nhập thất bại",
        description: error.message || "Vui lòng kiểm tra lại tài khoản hoặc mật khẩu.",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- XỬ LÝ ĐĂNG NHẬP BẰNG GOOGLE ---
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await googleLogin(credentialResponse.credential);

      if (res.success) {
        // Trường hợp 1: Đã có tài khoản và Active -> Có Token -> Đăng nhập luôn
        if (res.accessToken) {
          handleLoginSuccess(res);
        } 
        // Trường hợp 2: Tài khoản mới tạo hoặc chưa Active -> Chỉ hiện thông báo
        else {
          api.info({
            message: "Đăng ký thành công!",
            description: res.message, // "Vui lòng chờ Admin phê duyệt..."
            duration: 6,
            showProgress: true,
          });
        }
      }
    } catch (error) {
      api.error({
        message: "Lỗi Google Login",
        description: error.message || "Không thể kết nối tới máy chủ.",
      });
    }
  };

  return (
    <div className="auth-container">
      {contextHolder}
      
      <div className="auth-card">
        {/* Header Logo */}
        <div className="logo-section">
          {/* Logo FPT */}
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/FPT_Education_logo.svg/960px-FPT_Education_logo.svg.png" 
            alt="FPT Logo" 
            className="logo-img" 
            style={{ height: '50px', marginBottom: '15px' }}
          />
          <h2 className="school-name" style={{ color: "#F36F21", margin: 0 }}>FPT UNIVERSITY</h2>
          <Title level={3} style={{ marginTop: 10, color: "#333" }}>InfraLab Login</Title>
          <Text type="secondary">Sign in to access Lab Management System</Text>
        </div>

        {/* Form Đăng Nhập */}
        <Form
          name="login_form"
          layout="vertical"
          onFinish={onFinish}
          size="large"
          style={{ marginTop: 20 }}
        >
          <Form.Item
            label="User Name / Email"
            name="login"
            rules={[{ required: true, message: "Vui lòng nhập tài khoản!" }]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: "rgba(0,0,0,.25)" }} />} 
              placeholder="Enter your username or email" 
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
              placeholder="••••••••"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
            <Link to="#" style={{ color: '#F36F21', fontWeight: 500 }}>Forgot password?</Link>
          </div>

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
              Sign in
            </Button>
          </Form.Item>
        </Form>

        <Divider plain><span style={{ color: '#999', fontSize: '13px' }}>Or</span></Divider>

        {/* Nút Google */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => api.error({ message: "Login Failed" })}
            theme="outline"
            size="large"
            width="100%"
            text="signin_with"
            shape="rectangular"
          />
        </div>

        <div style={{ textAlign: "center" }}>
          <Text style={{ color: '#666' }}>Don't have an account? </Text>
          <Link to={ROUTES.REGISTER} style={{ color: "#F36F21", fontWeight: "bold" }}>Sign Up here</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;