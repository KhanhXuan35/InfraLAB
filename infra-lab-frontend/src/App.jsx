import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ROUTES } from "./constants/routes";

// Import Auth Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";

// Import Dashboards (Các file giao diện chính bạn đã có)
import UserDashboard from "./UserDashboard";
import TeacherDashboard from "./TeacherDashboard";
import SchoolDashboard from "./SchoolDashboard";

// Import Component bảo vệ
import PrivateRoute from "./components/PrivateRoute";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* --- 1. NHÓM ĐĂNG NHẬP/ĐĂNG KÝ --- */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />

        {/* --- 2. NHÓM TRANG CHỦ (Được bảo vệ) --- */}
        
        {/* Sinh viên -> Vào UserDashboard */}
        <Route element={<PrivateRoute allowedRoles={["student"]} />}>
          <Route path="/user-dashboard" element={<UserDashboard />} />
        </Route>

        {/* Quản lý Lab -> Vào TeacherDashboard */}
        <Route element={<PrivateRoute allowedRoles={["lab_manager"]} />}>
          <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
        </Route>

        {/* Admin Trường -> Vào SchoolDashboard */}
        <Route element={<PrivateRoute allowedRoles={["school_admin"]} />}>
          <Route path="/school-dashboard" element={<SchoolDashboard />} />
        </Route>

        {/* --- 3. ĐIỀU HƯỚNG MẶC ĐỊNH --- */}
        {/* Nếu gõ trang chủ / -> Đẩy về Login để kiểm tra */}
        <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />
        
        {/* Gõ linh tinh -> Đẩy về Login */}
        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
    </Router>
  );
}

export default App;