import React from 'react';
import UserDashboard from './UserDashboard';
import TeacherDashboard from './TeacherDashboard';
import SchoolDashboard from './assets/SchoolDashboard/SchoolDashboard.jsx';

function App() {
  /**
   * Chọn giao diện cần xem:
   *  - 'user'    : người dùng/sinh viên
   *  - 'teacher' : giáo viên/lab manager
   *  - 'school'  : nhà cung cấp thiết bị
   */
  const currentView = 'school'; // Thay đổi giá trị này để chuyển giao diện

  if (currentView === 'teacher') {
    return <TeacherDashboard />;
  }

  if (currentView === 'school') {
    return <SchoolDashboard />;
  }

  return <UserDashboard />;
}

export default App;
