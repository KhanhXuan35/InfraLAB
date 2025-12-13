import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import { CartProvider } from "./contexts/CartContext";
import { ROUTES, STUDENT_BASE_PATH, SCHOOL_ROUTES, LAB_MANAGER_ROUTES } from "./constants/routes";

// Auth pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
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
import Chat from "./pages/student/Chat/Chat";

// Lab Manager pages
import DeviceList from "./components/LabManager/DeviceList";
import DeviceDetailPage from "./pages/LabManager/DeviceDetailPage";
import BorrowReturnPage from "./pages/LabManager/BorrowReturnPage";
import LabManagerRepairDetail from "./pages/LabManager/LabManagerRepairDetail";
import StudentManagerPage from "./pages/LabManager/StudentManagerPage";

// School pages
import SchoolDashboard from './SchoolDashboard/SchoolDashboard.jsx';
import RepairRequestList from "./pages/School/RepairRequestList";
import LabManagerRepairList from "./pages/LabManager/LabManagerRepairList";
import SchoolRepairDetail from "./pages/School/SchoolRepairDetail";
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
            <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
            <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
            <Route element={<PrivateRoute allowedRoles={["student", "lab_manager"]} />}>
              <Route path={ROUTES.CHANGE_PASSWORD} element={<ChangePasswordPage />} />
            </Route>
            {/* --- DASHBOARD BY ROLE --- */}
            <Route element={<PrivateRoute allowedRoles={["student"]} />}>
              <Route path="/user-dashboard" element={<StudentHomePage />} />
            </Route>

            <Route element={<PrivateRoute allowedRoles={["lab_manager"]} />}>
              <Route path="/teacher-dashboard" element={<LabManagerHomePage />} />
              <Route path="/lab-manager/repairs/:id" element={<LabManagerRepairDetail />} />

            </Route>

            <Route element={<PrivateRoute allowedRoles={["school_admin"]} />}>
              <Route path="/school-dashboard" element={<SchoolAdminHomePage />} />
              <Route path="/requests" element={<RepairRequestList />} />
              <Route path="/school/dashboard" element={<SchoolDashboard />} />
              <Route path={SCHOOL_ROUTES.REPAIRS} element={<RepairRequestList />} />
              <Route path={SCHOOL_ROUTES.REPAIR_DETAIL(":id")} element={<SchoolRepairDetail />} />
            </Route>



            {/* --- LAB MANAGER PAGES --- */}
            <Route element={<PrivateRoute allowedRoles={["lab_manager"]} />}>
              <Route path="/lab-manager/devices" element={<DeviceList />} />
              <Route path="/lab-manager/device/:id" element={<DeviceDetailPage />} />
              <Route path="/lab-manager/students" element={<StudentManagerPage />} />
              <Route path={LAB_MANAGER_ROUTES.REPAIRS} element={<LabManagerRepairList />} />
              <Route path="/lab-manager/repairs/:id" element={<LabManagerRepairDetail />} />
              <Route path="/lab-manager/borrow-return" element={<BorrowReturnPage />} />
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
            <Route path={`${STUDENT_BASE_PATH}/conversation/:id?`} element={<Chat />} />

            {/* --- CHAT (Available for all authenticated users) --- */}
            <Route element={<PrivateRoute allowedRoles={["student", "lab_manager", "school_admin"]} />}>
              <Route path="/chat/:id?" element={<Chat />} />
            </Route>

            {/* --- PROFILE PAGE (Protected) --- */}
            <Route element={<PrivateRoute allowedRoles={["student", "lab_manager", "school_admin"]} />}>
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



