import React, { useEffect, useState, useRef } from "react"; // <--- Thêm useRef
import { useParams, useNavigate } from "react-router-dom";
import { Result, Button, List } from "antd";
import { CloseCircleOutlined } from "@ant-design/icons";
import { verifyEmail } from "../services/authService";
import { ROUTES } from "../constants/routes";

const VerifyEmailPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("Vui lòng đợi trong giây lát...");
  
  // Dùng useRef để chặn gọi API 2 lần trong StrictMode
  const isCalledRef = useRef(false); 

  useEffect(() => {
    // Nếu đã gọi rồi thì return luôn, không chạy tiếp
    if (isCalledRef.current) return;
    
    if (token) {
      isCalledRef.current = true; // Đánh dấu là đã gọi

      verifyEmail(token)
        .then((res) => {
          if (res.success) {
            setStatus("success");
            setMessage(res.message);
          } else {
            setStatus("error");
            setMessage(res.message);
          }
        })
        .catch((err) => {
          setStatus("error");
          setMessage(err.message || "Lỗi kết nối server");
        });
    }
  }, [token]);

  if (status === "verifying") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f0f2f5" }}>
        <Result status="info" title="Đang xác thực email..." subTitle={message} />
      </div>
    );
  }

  if (status === "success") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f0f2f5" }}>
        <div style={{ background: "#fff", padding: "40px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          <Result
            status="success"
            title="Xác thực email thành công!"
            subTitle={message}
            extra={[
              <Button type="primary" key="login" size="large" onClick={() => navigate(ROUTES.LOGIN)} style={{ backgroundColor: "#F36F21", borderColor: "#F36F21" }}>
                Đăng nhập ngay
              </Button>,
            ]}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f0f2f5" }}>
      <div style={{ background: "#fff", padding: "40px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", maxWidth: 600 }}>
        <Result
          icon={<CloseCircleOutlined style={{ color: "#ff4d4f" }} />}
          title="Xác thực thất bại"
          subTitle={message}
          extra={[
            <Button type="primary" key="home" onClick={() => navigate(ROUTES.LOGIN)}>
              Quay về trang đăng nhập
            </Button>,
          ]}
        >
           <div className="desc">
            <p style={{ fontSize: 16 }}><strong>Nguyên nhân có thể:</strong></p>
            <List size="small" dataSource={['Liên kết hết hạn', 'Liên kết đã được sử dụng', 'Lỗi hệ thống']} renderItem={(item) => <List.Item>{item}</List.Item>} />
          </div>
        </Result>
      </div>
    </div>
  );
};

export default VerifyEmailPage;