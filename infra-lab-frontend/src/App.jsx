import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { CartProvider } from './contexts/CartContext';
import Header from './components/Header/Header';
import ViewListDevices from './pages/student/ViewListDevices/ViewListDevices';
import DeviceDetail from './pages/student/DeviceDetail/DeviceDetail';
import RegisterBorrow from './pages/student/RegisterBorrow/RegisterBorrow';
import RegisterBorrowMultiple from './pages/student/RegisterBorrowMultiple/RegisterBorrowMultiple';
import Cart from './pages/student/Cart/Cart';
import { STUDENT_BASE_PATH } from './constants/routes';
import './App.css';

function App() {
  return (
    <ConfigProvider>
      <CartProvider>
        <Router>
          <div className="App">
            <Header />
            <Routes>
              {/* student home */}
              <Route path="/" element={<ViewListDevices />} />

              {/* student device list */}
              <Route path={`${STUDENT_BASE_PATH}/devices`} element={<ViewListDevices />} />

              {/* student device detail */}
              <Route path={`${STUDENT_BASE_PATH}/device/:id`} element={<DeviceDetail />} />

              {/* student register borrow */}
              <Route path={`${STUDENT_BASE_PATH}/borrow/:id`} element={<RegisterBorrow />} />

              {/* student register borrow multiple */}
              <Route path={`${STUDENT_BASE_PATH}/borrow/multiple`} element={<RegisterBorrowMultiple />} />

              {/* student cart */}
              <Route path={`${STUDENT_BASE_PATH}/cart`} element={<Cart />} />
            </Routes>
          </div>
        </Router>
      </CartProvider>
    </ConfigProvider>
  );
}

export default App;
