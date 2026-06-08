import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

import LoginPage              from './pages/LoginPage';
import DashboardPage          from './pages/DashboardPage';
import StudentsPage           from './pages/StudentsPage';
import StudentRegistrationPage from './pages/StudentRegistrationPage';
import TeachersPage           from './pages/TeachersPage';
import ClassesPage            from './pages/ClassesPage';
import AttendancePage         from './pages/AttendancePage';
import ReportsPage            from './pages/ReportsPage';
import PayrollPage            from './pages/PayrollPage';
import ApprovalsPage          from './pages/ApprovalsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e1e1e',
              color: '#fff',
              border: '1px solid #2a2a2a',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route path="/"         element={<Navigate to="/login" replace />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/students/register" element={<StudentRegistrationPage />} />

          <Route path="/dashboard"  element={<DashboardPage />} />
          <Route path="/students"   element={<StudentsPage />} />
          <Route path="/teachers"   element={<TeachersPage />} />
          <Route path="/classes"    element={<ClassesPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/reports"    element={<ReportsPage />} />
          <Route path="/reports/transcript/:studentId" element={<ReportsPage />} />
          <Route path="/payroll"    element={<PayrollPage />} />
          <Route path="/approvals"  element={<ApprovalsPage />} />
          <Route path="/audit"      element={<ApprovalsPage />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
