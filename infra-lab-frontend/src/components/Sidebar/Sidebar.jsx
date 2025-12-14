import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogoutOutlined } from '@ant-design/icons';
import { getSidebarConfig } from '../../constants/sidebarConfig';

const { Sider } = Layout;
const { Title, Text } = Typography;

const Sidebar = ({ role }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [selectedKey, setSelectedKey] = useState('');

    // Lấy menu tương ứng với role
    const menuItems = getSidebarConfig(role);

    // Logic: Highlight menu khi URL thay đổi
    useEffect(() => {
        const currentPath = location.pathname;
        const activeItem = menuItems.find(item =>
            currentPath === item.path || currentPath.startsWith(item.path + '/')
        );
        if (activeItem) {
            setSelectedKey(activeItem.key);
        }
    }, [location.pathname, menuItems]);

    const handleMenuClick = ({ key }) => {
        const item = menuItems.find(i => i.key === key);
        if (item && item.path) {
            navigate(item.path);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <Sider
            width={250}
            style={{
                background: '#001529',
                height: '100vh',
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                overflow: 'auto',
                zIndex: 1000
            }}
        >
            <div style={{ padding: 24, textAlign: 'center', borderBottom: '1px solid #303030' }}>
                <Title level={4} style={{ color: '#fff', margin: 0 }}>
                    InFra<span style={{ color: '#1890ff' }}>Lab</span>
                </Title>
                <Text type="secondary" style={{ color: '#8c8c8c', fontSize: 12 }}>
                    {role === 'lab_manager' ? 'QUẢN LÝ PHÒNG LAB' :
                        role === 'school_admin' ? 'QUẢN TRỊ VIÊN' : 'SINH VIÊN'}
                </Text>
            </div>

            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[selectedKey]}
                items={menuItems}
                style={{ borderRight: 0, marginTop: 16 }}
                onClick={handleMenuClick}
            />

            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: 16,
                    borderTop: '1px solid #303030',
                    cursor: 'pointer',
                }}
                onClick={handleLogout}
            >
                <Button
                    type="text"
                    icon={<LogoutOutlined />}
                    style={{ width: '100%', color: '#fff' }}
                >
                    Đăng xuất
                </Button>
            </div>
        </Sider>
    );
};

export default Sidebar;