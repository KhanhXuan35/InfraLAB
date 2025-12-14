import React from 'react';
import { Layout } from 'antd';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
// Import Header hiện tại của bạn. 
// LƯU Ý: Bạn cần đảm bảo Header.jsx của bạn không dùng fixed position đè lên layout
import Header from '../components/Header/Header';

const { Content } = Layout;

const MainLayout = ({ allowedRoles }) => {
    // Lấy thông tin user
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;

    // 1. Chưa đăng nhập -> Đá về Login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 2. Sai quyền (Role) -> Đá về trang chủ tương ứng
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        if (user.role === 'student') return <Navigate to="/user-dashboard" replace />;
        if (user.role === 'lab_manager') return <Navigate to="/teacher-dashboard" replace />;
        if (user.role === 'school_admin') return <Navigate to="/school-dashboard" replace />;
        return <Navigate to="/login" replace />;
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* Sidebar cố định bên trái */}
            <Sidebar role={user.role} />

            {/* Phần nội dung bên phải */}
            <Layout style={{ marginLeft: 250, transition: 'all 0.2s' }}>

                {/* Header nằm trong Layout con */}
                <Header />

                {/* Nơi nội dung các trang con sẽ hiển thị */}
                <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280 }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default MainLayout;