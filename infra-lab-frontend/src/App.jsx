import React from 'react';
import UserDashboard from './UserDashboard';
import TeacherDashboard from './TeacherDashboard';
import SchoolDashboard from './SchoolDashboard';

function App() {
  /**
   * Chọn giao diện cần xem:
   *  - 'user'    : người dùng/sinh viên
   *  - 'teacher' : giáo viên/lab manager
   *  - 'school'  : nhà cung cấp thiết bị
   */
  const currentView = 'school';

  if (currentView === 'teacher') {
    return <TeacherDashboard />;
  }

  if (currentView === 'school') {
    return <SchoolDashboard />;
  }

  return <UserDashboard />;
}

export default App;