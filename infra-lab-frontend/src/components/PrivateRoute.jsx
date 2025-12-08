import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "../constants/routes";

const PrivateRoute = ({ allowedRoles }) => {
  // 1. Kiểm tra xem có "thẻ" (Token) chưa?
  const token = localStorage.getItem("accessToken");
  
  // 2. Lấy thông tin người dùng để xem chức vụ (Role) là gì
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : {};

  // Nếu chưa có thẻ -> Đuổi về cổng (Trang Login)
  if (!token) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // Nếu thẻ không đúng quyền (VD: Sinh viên đòi vào phòng Hiệu trưởng) -> Đuổi về
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // Nếu hợp lệ -> Mời vào (Hiển thị trang bên trong)
  return <Outlet />;
};

export default PrivateRoute;