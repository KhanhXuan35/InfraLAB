import React from 'react';
import {
    DashboardOutlined,
    ToolOutlined,
    ShoppingOutlined,
    FileTextOutlined,
    BellOutlined,
    MessageOutlined,
    TeamOutlined,
    HomeOutlined,
    HistoryOutlined,
    AppstoreOutlined,
    SwapOutlined
} from '@ant-design/icons';
import { ROUTES, STUDENT_ROUTES, LAB_MANAGER_ROUTES, SCHOOL_ROUTES } from './routes';

export const getSidebarConfig = (role) => {
    switch (role) {
        case 'lab_manager':
            return [
                {
                    key: 'dashboard',
                    icon: <DashboardOutlined />,
                    label: 'Thống kê',
                    path: LAB_MANAGER_ROUTES.DASHBOARD,
                },
                {
                    key: 'devices',
                    icon: <ToolOutlined />,
                    label: 'Quản lý thiết bị',
                    path: LAB_MANAGER_ROUTES.DEVICES,
                },
                {
                    key: 'repairs',
                    icon: <ToolOutlined />,
                    label: 'Danh sách sửa chữa',
                    path: LAB_MANAGER_ROUTES.REPAIRS,
                },
                {
                    key: 'borrow',
                    icon: <ShoppingOutlined />,
                    label: 'DS thiết bị mượn',
                    path: '/lab-manager/borrow-return',
                },
                {
                    key: 'students',
                    icon: <TeamOutlined />,
                    label: 'Quản lý sinh viên',
                    path: '/lab-manager/students',
                },
                {
                    key: 'chat',
                    icon: <MessageOutlined />,
                    label: 'Tin nhắn',
                    path: '/chat',
                },
            ];

        case 'student':
            return [
                {
                    key: 'home',
                    icon: <HomeOutlined />,
                    label: 'Trang chủ',
                    path: '/user-dashboard',
                },
                {
                    key: 'devices',
                    icon: <AppstoreOutlined />,
                    label: 'Danh sách thiết bị',
                    path: STUDENT_ROUTES.DEVICES,
                },
                {
                    key: 'cart',
                    icon: <ShoppingOutlined />,
                    label: 'Giỏ hàng',
                    path: STUDENT_ROUTES.CART,
                },
                {
                    key: 'borrowed',
                    icon: <HistoryOutlined />,
                    label: 'Lịch sử mượn',
                    path: STUDENT_ROUTES.BORROWED,
                },
                {
                    key: 'chat',
                    icon: <MessageOutlined />,
                    label: 'Tin nhắn',
                    path: '/chat',
                },
                {
                    key: 'profile',
                    icon: <TeamOutlined />,
                    label: 'Hồ sơ cá nhân',
                    path: '/profile',
                },
            ];

        case 'school_admin':
            return [
                {
                    key: 'dashboard',
                    icon: <DashboardOutlined />,
                    label: 'Tổng quan',
                    path: SCHOOL_ROUTES.DASHBOARD,
                },
                {
                    key: 'devices',
                    icon: <ToolOutlined />,
                    label: 'Quản lý thiết bị',
                    path: SCHOOL_ROUTES.DEVICES,
                },
                {
                    key: 'requests',
                    icon: <FileTextOutlined />,
                    label: 'Yêu cầu sửa chữa',
                    path: SCHOOL_ROUTES.REPAIRS,
                },
            ];

        default:
            return [];
    }
};