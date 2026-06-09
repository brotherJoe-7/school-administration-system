import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NAV_ITEMS = {
  admin: [
    { label: 'Dashboard',       path: '/dashboard',    icon: '' },
    { label: 'Students',        path: '/students',     icon: '' },
    { label: 'Teachers',        path: '/teachers',     icon: '' },
    { label: 'Classes',         path: '/classes',      icon: '' },
    { label: 'Attendance',      path: '/attendance',   icon: '' },
    { label: 'Reports & GPA',   path: '/reports',      icon: '' },
    { label: 'Payroll',         path: '/payroll',      icon: '' },
    { label: 'Approval Queue',  path: '/approvals',    icon: '' },
    { label: 'Audit Log',       path: '/audit',        icon: '' },
  ],
  teacher: [
    { label: 'Dashboard',     path: '/dashboard',  icon: '' },
    { label: 'My Classes',    path: '/classes',    icon: '' },
    { label: 'Attendance',    path: '/attendance', icon: '' },
    { label: 'Enter Grades',  path: '/reports',    icon: '' },
    { label: 'My Payslips',   path: '/payroll',    icon: '' },
  ],
  student: [
    { label: 'Dashboard',     path: '/dashboard',  icon: '' },
    { label: 'My Attendance', path: '/attendance', icon: '' },
    { label: 'My Transcript', path: '/reports',    icon: '' },
    { label: 'My Payments',   path: '/payments',   icon: '' },
  ],
};

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const navItems = NAV_ITEMS[user.role] || [];
  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo" style={{ flexShrink: 0 }}>
        <div className="sidebar-logo-icon">SAS</div>
        <div className="sidebar-logo-text">
          <h2>School Administration System</h2>
          <span>Institutional Portal</span>
        </div>
      </div>

      {/* Nav — scrollable */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map((item) => (
          <NavLink
            key={item.path + item.label}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer — always pinned at bottom */}
      <div className="sidebar-footer" style={{ flexShrink: 0 }}>
        <div className="user-pill" style={{ marginBottom: '8px' }}>
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="name">{user.name}</div>
            <div className="role">{user.role}</div>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm w-full" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
