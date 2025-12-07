import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ROUTES } from "./constants/routes";
import { CartProvider } from "./contexts/CartContext";

// Import Auth Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";

// Import HomePages
import StudentHomePage from "./pages/Student/StudentHomePage";
import LabManagerHomePage from "./pages/LabManager/LabManagerHomePage";
import SchoolAdminHomePage from "./pages/SchoolAdmin/SchoolAdminHomePage";

// Import Component bảo vệ
import PrivateRoute from "./components/PrivateRoute";
import "./App.css";

function App() {
  return (
    <CartProvider>
      <Router>
        <Routes>
        {/* --- 1. NHÓM ĐĂNG NHẬP/ĐĂNG KÝ --- */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />

        {/* --- 2. NHÓM TRANG CHỦ (Được bảo vệ) --- */}
        
        {/* Sinh viên -> Vào StudentHomePage */}
        <Route element={<PrivateRoute allowedRoles={["student"]} />}>
          <Route path="/user-dashboard" element={<StudentHomePage />} />
        </Route>

        {/* Quản lý Lab -> Vào LabManagerHomePage */}
        <Route element={<PrivateRoute allowedRoles={["lab_manager"]} />}>
          <Route path="/teacher-dashboard" element={<LabManagerHomePage />} />
        </Route>

        {/* Admin Trường -> Vào SchoolAdminHomePage */}
        <Route element={<PrivateRoute allowedRoles={["school_admin"]} />}>
          <Route path="/school-dashboard" element={<SchoolAdminHomePage />} />
        </Route>

        {/* --- 3. ĐIỀU HƯỚNG MẶC ĐỊNH --- */}
        {/* Nếu gõ trang chủ / -> Đẩy về Login để kiểm tra */}
        <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />
        
        {/* Gõ linh tinh -> Đẩy về Login */}
        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;