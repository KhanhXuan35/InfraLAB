import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header/Header';
import { ROUTES } from '../constants/routes';

const ConditionalHeader = () => {
  const location = useLocation();
  
  // Danh sách các route không hiển thị Header
  const noHeaderRoutes = [
    ROUTES.LOGIN,
    ROUTES.REGISTER,
  ];
  
  // Kiểm tra xem route hiện tại có nên hiển thị Header không
  const shouldShowHeader = !noHeaderRoutes.some(route => {
    // Xử lý route có params như /verify-email/:token
    if (route.includes(':')) {
      const routePattern = route.split('/:')[0];
      return location.pathname.startsWith(routePattern);
    }
    return location.pathname === route;
  });
  
  // Kiểm tra thêm: nếu đang ở trang verify-email thì cũng không hiển thị Header
  if (location.pathname.startsWith('/verify-email/')) {
    return null;
  }
  
  if (!shouldShowHeader) {
    return null;
  }
  
  return <Header />;
};

export default ConditionalHeader;

