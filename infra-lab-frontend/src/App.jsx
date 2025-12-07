import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ROUTES } from "./constants/routes";

// Import các trang (Cổng và các phòng)
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import UserDashboard from "./UserDashboard";       // Phòng Sinh viên
import TeacherDashboard from "./TeacherDashboard"; // Phòng Giáo viên
import SchoolDashboard from "./SchoolDashboard";   // Phòng Admin

import PrivateRoute from "./components/PrivateRoute"; // Bác bảo vệ
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* --- KHU VỰC CÔNG CỘNG (Ai cũng vào được) --- */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />

        {/* --- KHU VỰC RIÊNG TƯ (Phải có thẻ mới vào được) --- */}
        
        {/* Phòng Sinh viên (Chỉ role 'student' được vào) */}
        <Route element={<PrivateRoute allowedRoles={["student"]} />}>
          <Route path="/user-dashboard" element={<UserDashboard />} />
        </Route>

        {/* Phòng Quản lý Lab (Chỉ role 'lab_manager' được vào) */}
        <Route element={<PrivateRoute allowedRoles={["lab_manager"]} />}>
          <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
        </Route>

        {/* Phòng Admin Trường (Chỉ role 'school_admin' được vào) */}
        <Route element={<PrivateRoute allowedRoles={["school_admin"]} />}>
          <Route path="/school-dashboard" element={<SchoolDashboard />} />
        </Route>

        {/* Mặc định: Vào trang chủ thì đá về Login để kiểm tra lại */}
        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
    </Router>
  );
}

export default App;