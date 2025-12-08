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
    
    // Danh sách các route của lab_manager (không hiển thị Header)
    const labManagerRoutes = [
      '/teacher-dashboard',
      '/lab-manager/devices',
      '/lab-manager/device',
    ];
    
    const pathname = location.pathname;
    
    // Kiểm tra verify-email
    if (pathname.startsWith('/verify-email/')) {
      return false;
    }
    
    // Kiểm tra lab_manager routes
    const isLabManagerRoute = labManagerRoutes.some(route => {
      return pathname.startsWith(route);
    });
    
    if (isLabManagerRoute) {
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


