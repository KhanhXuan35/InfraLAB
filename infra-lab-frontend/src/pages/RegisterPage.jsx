import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { ROUTES } from "../constants/routes";
import { register } from "../services/authService";
import "../App.css";

const RegisterPage = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [strength, setStrength] = useState(0);

  // Tính điểm độ mạnh mật khẩu (để hiển thị thanh trạng thái)
  useEffect(() => {
    const pass = formData.password;
    let score = 0;
    if (!pass) {
      setStrength(0);
      return;
    }
    if (pass.length >= 8) score += 1;
    if (pass.length > 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1; // Hoa
    if (/[0-9]/.test(pass)) score += 1; // Số
    if (/[^A-Za-z0-9]/.test(pass)) score += 1; // Đặc biệt
    
    setStrength(Math.min(score, 5));
  }, [formData.password]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Kiểm tra mật khẩu trùng khớp
    if (formData.password !== formData.confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }

    // 2. VALIDATE MẬT KHẨU (YÊU CẦU MỚI: 8-15 ký tự, Hoa, Thường, Số, Đặc biệt)
    // Regex giải thích:
    // (?=.*[a-z]): Ít nhất 1 thường
    // (?=.*[A-Z]): Ít nhất 1 hoa
    // (?=.*\d): Ít nhất 1 số
    // (?=.*[\W_]): Ít nhất 1 ký tự đặc biệt
    // .{8,15}: Độ dài 8-15
    const strictPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,15}$/;
    
    if (!strictPasswordRegex.test(formData.password)) {
      alert("Mật khẩu phải từ 8-15 ký tự, bao gồm: Chữ Hoa, Chữ Thường, Số và Ký tự đặc biệt!");
      return;
    }

    // 3. Validate Username (8-15 ký tự, chữ + số)
    const usernameRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z0-9]{8,15}$/;
    if (!usernameRegex.test(formData.username)) {
      alert("Username phải từ 8-15 ký tự, bao gồm cả chữ và số, không chứa ký tự đặc biệt!");
      return;
    }

    // 4. Validate Fullname
    const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
    if (!nameRegex.test(formData.fullName)) {
      alert("Họ tên chỉ được chứa chữ cái và khoảng trắng!");
      return;
    }

    try {
      const payload = {
        name: formData.fullName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: "student",
      };

      const res = await register(payload);
      
      if (res.success) {
        alert(res.message);
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
                placeholder="nguyenvana123"
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input 
              name="email" 
              type="email" 
              placeholder="email@example.com" 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <input
                type={showPass ? "text" : "password"}
                name="password"
                placeholder="8-15 chars, Upper, Lower, Number & Special" 
                onChange={handleChange}
                required
              />
              <span className="eye-icon" onClick={() => setShowPass(!showPass)}>
                {showPass ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <div className="input-wrapper">
              <input
                type={showConfirmPass ? "text" : "password"}
                name="confirmPassword"
                placeholder="Re-enter password"
                onChange={handleChange}
                required
              />
              <span className="eye-icon" onClick={() => setShowConfirmPass(!showConfirmPass)}>
                {showConfirmPass ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

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