import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import Header from './components/Header/Header';
import ViewListDevices from './pages/student/ViewListDevices/ViewListDevices';
import DeviceDetail from './pages/student/DeviceDetail/DeviceDetail';
import RegisterBorrow from './pages/student/RegisterBorrow/RegisterBorrow';
import { STUDENT_BASE_PATH } from './constants/routes';
import './App.css';

function App() {
  return (
    <ConfigProvider>
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
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App;
