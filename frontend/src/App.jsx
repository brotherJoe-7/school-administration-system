import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

import LoginPage              from './pages/LoginPage';
import LandingPage            from './pages/LandingPage';
import CreateSchoolPage       from './pages/CreateSchoolPage';
import DashboardPage          from './pages/DashboardPage';
import StudentsPage           from './pages/StudentsPage';
import StudentRegistrationPage from './pages/StudentRegistrationPage';
import StudentSetupPage       from './pages/StudentSetupPage';
import ResetPasswordPage      from './pages/ResetPasswordPage';
import TeachersPage           from './pages/TeachersPage';
import ClassesPage            from './pages/ClassesPage';
import AttendancePage         from './pages/AttendancePage';
import ReportsPage            from './pages/ReportsPage';
import PayrollPage            from './pages/PayrollPage';
import ApprovalsPage          from './pages/ApprovalsPage';
import AuditLogPage           from './pages/AuditLogPage';
import PaymentsPage           from './pages/PaymentsPage';
import SettingsPage           from './pages/SettingsPage';
import PlatformDashboardPage  from './pages/PlatformDashboardPage';
import AiAssistantPage        from './pages/AiAssistantPage';
import { PrivacyPage, TermsPage, GDPRPage, PricingPage, ContactPage } from './pages/PublicPages';

function App() {
  React.useEffect(() => {
    const savedColor = localStorage.getItem('tenantColor');
    if (savedColor) {
      document.documentElement.style.setProperty('--color-gold', savedColor);
      const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
      };
      const rgb = hexToRgb(savedColor);
      if(rgb) {
        document.documentElement.style.setProperty('--color-gold-muted', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
      }
    }
    
    const savedTheme = localStorage.getItem('themeMode');
    if (savedTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

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
          <Route path="/"         element={<LandingPage />} />
          <Route path="/create-school" element={<CreateSchoolPage />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/setup"    element={<StudentSetupPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/students/register" element={<StudentRegistrationPage />} />
          
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms"   element={<TermsPage />} />
          <Route path="/gdpr"    element={<GDPRPage />} />

          <Route path="/dashboard"  element={<DashboardPage />} />
          <Route path="/students"   element={<StudentsPage />} />
          <Route path="/teachers"   element={<TeachersPage />} />
          <Route path="/classes"    element={<ClassesPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/reports"    element={<ReportsPage />} />
          <Route path="/reports/transcript/:studentId" element={<ReportsPage />} />
          <Route path="/payroll"    element={<PayrollPage />} />
          <Route path="/payments"   element={<PaymentsPage />} />
          <Route path="/approvals"  element={<ApprovalsPage />} />
          <Route path="/audit"      element={<AuditLogPage />} />
          <Route path="/settings"   element={<SettingsPage />} />
          <Route path="/ai"         element={<AiAssistantPage />} />
          <Route path="/platform"   element={<PlatformDashboardPage />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
