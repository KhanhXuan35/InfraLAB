import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import UserDashboard from './UserDashboard';
import TeacherDashboard from './TeacherDashboard';
import SchoolDashboard from './SchoolDashboard/SchoolDashboard.jsx';

function App() {
  return (
    <Routes>
      <Route path="/school/dashboard" element={<SchoolDashboard />} />
      <Route path="/teacher" element={<TeacherDashboard />} />
      <Route path="/" element={<UserDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
