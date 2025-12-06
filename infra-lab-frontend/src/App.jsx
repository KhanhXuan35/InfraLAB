import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import Header from './components/Header/Header';
import ViewListDevices from './pages/ViewListDevices/ViewListDevices';
import DeviceDetail from './pages/DeviceDetail/DeviceDetail';
import RegisterBorrow from './pages/RegisterBorrow/RegisterBorrow';
import { STUDENT_BASE_PATH } from './constants/routes';
import './App.css';

function App() {
  return (
    <ConfigProvider>
      <Router>
        <div className="App">
          <Header />
          <Routes>
            <Route path="/" element={<ViewListDevices />} />
            <Route path={`${STUDENT_BASE_PATH}/devices`} element={<ViewListDevices />} />
            <Route path={`${STUDENT_BASE_PATH}/device/:id`} element={<DeviceDetail />} />
            <Route path="/device/:id" element={<DeviceDetail />} />
            <Route path={`${STUDENT_BASE_PATH}/borrow/:id`} element={<RegisterBorrow />} />
            <Route path="/borrow/:id" element={<RegisterBorrow />} />
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App;
