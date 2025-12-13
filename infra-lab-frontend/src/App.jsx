import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import { CartProvider } from "./contexts/CartContext";
import { ROUTES, STUDENT_BASE_PATH } from "./constants/routes";

// Auth pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";

// Home dashboards
import StudentHomePage from "./pages/Student/StudentHomePage";
import LabManagerHomePage from "./pages/LabManager/LabManagerHomePage";
import SchoolAdminHomePage from "./pages/SchoolAdmin/SchoolAdminHomePage";

// Components
import PrivateRoute from "./components/PrivateRoute";
import ConditionalHeader from "./components/ConditionalHeader";

// Student pages
import ViewListDevices from "./pages/student/ViewListDevices/ViewListDevices";
import DeviceDetail from "./pages/student/DeviceDetail/DeviceDetail";
import RegisterBorrow from "./pages/student/RegisterBorrow/RegisterBorrow";
import RegisterBorrowMultiple from "./pages/student/RegisterBorrowMultiple/RegisterBorrowMultiple";
import Cart from "./pages/student/Cart/Cart";
import LoanDeviceList from "./pages/student/LoanDeviceList/LoanDeviceList";

// Lab Manager pages
import DeviceList from "./components/LabManager/DeviceList";
import DeviceDetailPage from "./pages/LabManager/DeviceDetailPage";

// School pages
import SchoolDashboard from './SchoolDashboard/SchoolDashboard.jsx';
import RepairRequestList from "./pages/School/RepairRequestList";

// Profile page
import UserProfile from "./pages/Profile/UserProfile";

import "./App.css";

function App() {
  return (
    <ConfigProvider>
      <CartProvider>
        <Router>
          <ConditionalHeader />

          <Routes>
            {/* --- AUTH --- */}
            <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
            <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />

            {/* --- DASHBOARD BY ROLE --- */}
            <Route element={<PrivateRoute allowedRoles={["student"]} />}>
              <Route path="/user-dashboard" element={<StudentHomePage />} />
            </Route>

            <Route element={<PrivateRoute allowedRoles={["lab_manager"]} />}>
              <Route path="/teacher-dashboard" element={<LabManagerHomePage />} />
            </Route>

            <Route element={<PrivateRoute allowedRoles={["school_admin"]} />}>
              <Route path="/school-dashboard" element={<SchoolAdminHomePage />} />
              <Route path="/requests" element={<RepairRequestList />} />
              <Route path="/school/dashboard" element={<SchoolDashboard />} />
            </Route>
          


            {/* --- LAB MANAGER PAGES --- */}
            <Route element={<PrivateRoute allowedRoles={["lab_manager"]} />}>
              <Route path="/lab-manager/devices" element={<DeviceList />} />
              <Route path="/lab-manager/device/:id" element={<DeviceDetailPage />} />
            </Route>

            {/* --- SCHOOL PAGES --- */}
            <Route path="/repairs" element={<RepairRequestList />} />

            {/* --- STUDENT PAGES --- */}
            {/* <Route path="/" element={<ViewListDevices />} /> */}
            <Route path={`${STUDENT_BASE_PATH}/devices`} element={<ViewListDevices />} />
            <Route path={`${STUDENT_BASE_PATH}/device/:id`} element={<DeviceDetail />} />
            <Route path={`${STUDENT_BASE_PATH}/borrow/:id`} element={<RegisterBorrow />} />
            <Route path={`${STUDENT_BASE_PATH}/borrow/multiple`} element={<RegisterBorrowMultiple />} />
            <Route path={`${STUDENT_BASE_PATH}/cart`} element={<Cart />} />
            <Route path={`${STUDENT_BASE_PATH}/borrowed`} element={<LoanDeviceList />} />

            {/* --- PROFILE PAGE (Protected) --- */}
            <Route element={<PrivateRoute allowedRoles={["student"]} />}>
              <Route path="/profile" element={<UserProfile />} />
            </Route>

            {/* --- DEFAULT ROUTES --- */}
            <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
          </Routes>
        </Router>
      </CartProvider>
    </ConfigProvider>
  );
}

export default App;
