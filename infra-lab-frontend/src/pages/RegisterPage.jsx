import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { ROUTES } from "../constants/routes";
import { register } from "../services/authService";
import "../App.css";

const RegisterPage = () => {
  const navigate = useNavigate();
  
  // State lưu trữ dữ liệu form
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // State hiển thị/ẩn mật khẩu
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  
  // State độ mạnh mật khẩu (0-5)
  const [strength, setStrength] = useState(0);

  // Tính toán độ mạnh mật khẩu mỗi khi password thay đổi
  useEffect(() => {
    const pass = formData.password;
    let score = 0;
    if (!pass) {
      setStrength(0);
      return;
    }
    if (pass.length > 5) score += 1; // Độ dài > 5
    if (pass.length > 8) score += 1; // Độ dài > 8
    if (/[A-Z]/.test(pass)) score += 1; // Có chữ hoa
    if (/[0-9]/.test(pass)) score += 1; // Có số
    if (/[^A-Za-z0-9]/.test(pass)) score += 1; // Có ký tự đặc biệt
    setStrength(score);
  }, [formData.password]);

  // Xử lý khi nhập liệu
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Xử lý Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validate cơ bản
    if (formData.password !== formData.confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }
    if (strength < 3) {
      alert("Mật khẩu quá yếu! Vui lòng đặt mật khẩu mạnh hơn.");
      return;
    }

    try {
      // 2. Chuẩn bị dữ liệu gửi xuống Backend
      const payload = {
        name: formData.fullName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: "student", // Mặc định là sinh viên
      };

      // 3. Gọi API
      const res = await register(payload);
      
      // 4. Xử lý thành công
      if (res.success) {
        alert(res.message); // "Vui lòng kiểm tra email..."
        navigate(ROUTES.LOGIN);
      }
    } catch (err) {
      alert(err.message || "Đăng ký thất bại");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card wide">
        <h3 className="auth-title">Sign Up</h3>
        <p className="auth-subtitle">Create your InfraLab account</p>

        <form onSubmit={handleSubmit}>
          {/* Hàng 1: Full Name & User Name */}
          <div className="row">
            <div className="form-group col">
              <label>Full Name</label>
              <input 
                name="fullName" 
                type="text" 
                placeholder="Nguyen Van A"
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group col">
              <label>User Name</label>
              <input 
                name="username" 
                type="text" 
                placeholder="nguyenvana"
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label>Email Address</label>
            <input 
              name="email" 
              type="email" 
              placeholder="email@fpt.edu.vn" 
              onChange={handleChange} 
              required 
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <input
                type={showPass ? "text" : "password"}
                name="password"
                placeholder="8+ Characters required"
                onChange={handleChange}
                required
              />
              <span className="eye-icon" onClick={() => setShowPass(!showPass)}>
                {showPass ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label>Confirm Password</label>
            <div className="input-wrapper">
              <input
                type={showConfirmPass ? "text" : "password"}
                name="confirmPassword"
                placeholder="Re-enter your password"
                onChange={handleChange}
                required
              />
              <span className="eye-icon" onClick={() => setShowConfirmPass(!showConfirmPass)}>
                {showConfirmPass ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          {/* --- THANH ĐO ĐỘ MẠNH (CỐ ĐỊNH) --- */}
          <div className="strength-container">
            <div className="strength-meter">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="strength-step">
                  <div className={`circle ${strength >= item ? "active" : ""}`}>
                    {item}
                  </div>
                </div>
              ))}
            </div>
            <div className="strength-labels">
              <span>Very Weak</span>
              <span>Weak</span>
              <span>Fair</span>
              <span>Strong</span>
              <span>Very Strong</span>
            </div>
          </div>
          {/* ---------------------------------- */}

          <button type="submit" className="btn-primary">Sign Up</button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to={ROUTES.LOGIN}>Sign In here</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;