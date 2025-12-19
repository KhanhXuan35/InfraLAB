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
import StudentHomePage from "./pages/student/StudentHomePage";
import LabManagerHomePage from "./pages/LabManager/LabManagerHomePage";
import SchoolAdminHomePage from "./pages/SchoolAdmin/SchoolAdminHomePage";
import ReportsPage from "./pages/SchoolAdmin/ReportsPage";

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
import BorrowApprovalPage from "./pages/LabManager/BorrowApprovalPage";
import LabManagerRepairDetail from "./pages/LabManager/LabManagerRepairDetail";
import StudentManagerPage from "./pages/LabManager/StudentManagerPage";
import DeviceListSchool from "./pages/LabManager/DeviceListSchool";
import CertificatesPage from "./pages/LabManager/CertificatesPage";

// School pages
import SchoolDashboard from './SchoolDashboard/SchoolDashboard.jsx';
import ViewDetailDevice from './SchoolDashboard/viewdetailDevice.jsx';
import RepairRequestList from "./pages/School/RepairRequestList";
import LabManagerRepairList from "./pages/LabManager/LabManagerRepairList";
import SchoolRepairDetail from "./pages/School/SchoolRepairDetail";
import BorrowRequests from "./pages/SchoolAdmin/BorrowRequests";
import CreateDeviceWithInstances from "./pages/SchoolAdmin/CreateDeviceWithInstances.jsx";

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

            {/* --- LAB MANAGER PAGES --- */}
            <Route element={<PrivateRoute allowedRoles={["lab_manager"]} />}>
              {/* Dashboard */}
              <Route path={LAB_MANAGER_ROUTES.DASHBOARD} element={<LabManagerHomePage />} />
              
              {/* Devices Management */}
              <Route path={LAB_MANAGER_ROUTES.DEVICES} element={<DeviceList />} />
              <Route path={LAB_MANAGER_ROUTES.DEVICE_DETAIL(":id")} element={<DeviceDetailPage />} />
              
              {/* School Inventory */}
              <Route path={LAB_MANAGER_ROUTES.SCHOOL_DEVICES} element={<DeviceListSchool />} />
              
              {/* Borrow/Return */}
              <Route path={LAB_MANAGER_ROUTES.BORROW_RETURN} element={<BorrowReturnPage />} />
              <Route path={LAB_MANAGER_ROUTES.BORROW_APPROVAL} element={<BorrowApprovalPage />} />
              
              {/* Repairs */}
              <Route path={LAB_MANAGER_ROUTES.REPAIRS} element={<LabManagerRepairList />} />
              <Route path={LAB_MANAGER_ROUTES.REPAIR_DETAIL(":id")} element={<LabManagerRepairDetail />} />
              
              {/* Students Management */}
              <Route path={LAB_MANAGER_ROUTES.STUDENTS} element={<StudentManagerPage />} />
              
              {/* Certificates */}
              <Route path={LAB_MANAGER_ROUTES.CERTIFICATES} element={<CertificatesPage />} />
            </Route>

            <Route element={<PrivateRoute allowedRoles={["school_admin"]} />}>
              <Route path="/school-dashboard" element={<SchoolAdminHomePage />} />
              <Route path="/requests" element={<RepairRequestList />} />
              <Route path="/school/dashboard" element={<SchoolDashboard />} />
              <Route path="/school/devices/create-with-instances" element={<CreateDeviceWithInstances />} />
              <Route path={SCHOOL_ROUTES.REPAIRS} element={<RepairRequestList />} />
              <Route path={SCHOOL_ROUTES.REPAIR_DETAIL(":id")} element={<SchoolRepairDetail />} />
              <Route path="/school/borrow-requests" element={<BorrowRequests />} />
              <Route path="/school/device/:id" element={<ViewDetailDevice />} />
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

            {/* --- SHARED PAGES (Available for multiple roles) --- */}
            <Route element={<PrivateRoute allowedRoles={["student", "lab_manager", "school_admin"]} />}>
              {/* Chat */}
              <Route path={LAB_MANAGER_ROUTES.CHAT} element={<Chat />} />
              <Route path="/chat/:id?" element={<Chat />} />

              {/* Profile */}
              <Route path="/profile" element={<UserProfile />} />
            </Route>

            {/* --- REPORTS & NOTIFICATIONS (Available for lab_manager and school_admin) --- */}
            <Route element={<PrivateRoute allowedRoles={["lab_manager", "school_admin"]} />}>
              <Route path={LAB_MANAGER_ROUTES.REPORTS} element={<ReportsPage />} />
              <Route path={LAB_MANAGER_ROUTES.NOTIFICATIONS} element={<div>Notifications Page - Coming Soon</div>} />
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



