import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header/Header';
import { ROUTES } from '../constants/routes';

const ConditionalHeader = () => {
  const location = useLocation();
  
  // Memoize để tránh re-render không cần thiết
  const shouldRenderHeader = useMemo(() => {
    // Danh sách các route không hiển thị Header
    const noHeaderRoutes = [
      ROUTES.LOGIN,
      ROUTES.REGISTER,
    ];

    // Danh sách các route của school_admin (không hiển thị Header)
    const schoolAdminRoutes = [
      '/school-dashboard',
      '/school/dashboard',
      '/requests',
    ];
    
    const pathname = location.pathname;
    
    // Kiểm tra verify-email
    if (pathname.startsWith('/verify-email/')) {
      return false;
    }

    // Kiểm tra school_admin routes
    const isSchoolAdminRoute = schoolAdminRoutes.some(route => pathname.startsWith(route));
    if (isSchoolAdminRoute) {
      return false;
    }

    // Ẩn header trên trang hồ sơ cá nhân (/profile) cho student
    if (pathname.startsWith('/profile')) {
      return false;
    }
    
    // Kiểm tra noHeaderRoutes
    const shouldHide = noHeaderRoutes.some(route => {
      if (route.includes(':')) {
        const routePattern = route.split('/:')[0];
        return pathname.startsWith(routePattern);
      }
      return pathname === route;
    });
    
    return !shouldHide;
  }, [location.pathname]);
  
  if (!shouldRenderHeader) {
    return null;
  }
  
  return <Header />;
};

export default ConditionalHeader;




