import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NAV_ITEMS = {
  admin: [
    { label: 'Dashboard',      path: '/dashboard',  icon: '◈' },
    { label: 'Students',       path: '/students',   icon: '◉' },
    { label: 'Teachers',       path: '/teachers',   icon: '◎' },
    { label: 'Classes',        path: '/classes',    icon: '▦' },
    { label: 'Attendance',     path: '/attendance', icon: '◷' },
    { label: 'Reports & GPA',  path: '/reports',    icon: '▤' },
    { label: 'Payroll',        path: '/payroll',    icon: '◈' },
    { label: 'Approval Queue', path: '/approvals',  icon: '◈' },
    { label: 'Audit Log',      path: '/audit',      icon: '▦' },
    { label: 'AI Assistant',   path: '/ai',         icon: '◈' },
    { label: 'Settings',       path: '/settings',   icon: '◎' },
  ],
  superadmin: [
    { label: 'Platform Overview', path: '/platform', icon: '◈' },
    { label: 'AI Assistant',      path: '/ai',       icon: '◈' },
    { label: 'System Audit',      path: '/audit',    icon: '▦' },
    { label: 'Settings',          path: '/settings', icon: '◎' },
  ],
  teacher: [
    { label: 'Dashboard',    path: '/dashboard',  icon: '◈' },
    { label: 'My Classes',   path: '/classes',    icon: '▦' },
    { label: 'Attendance',   path: '/attendance', icon: '◷' },
    { label: 'Enter Grades', path: '/reports',    icon: '▤' },
    { label: 'My Payslips',  path: '/payroll',    icon: '◈' },
  ],
  student: [
    { label: 'Dashboard',     path: '/dashboard',  icon: '◈' },
    { label: 'My Attendance', path: '/attendance', icon: '◷' },
    { label: 'My Transcript', path: '/reports',    icon: '▤' },
    { label: 'My Payments',   path: '/payments',   icon: '◈' },
  ],
};

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const navItems = NAV_ITEMS[user.role] || [];
  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>

      {/* ── Logo ── */}
      <div className="sidebar-logo" style={{ flexShrink: 0 }}>
        <div className="sidebar-logo-icon">SAS</div>
        <div className="sidebar-logo-text">
          <h2>School Administration</h2>
          <span>Institutional Portal</span>
        </div>
      </div>

      {/* ── Scrollable nav area ── */}
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

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--color-border)', margin: '16px 0 12px' }} />

        {/* View Website */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-item"
          style={{ textDecoration: 'none', marginBottom: '4px' }}
        >
          View Website
        </a>

        {/* Sign Out */}
        <button
          onClick={handleLogout}
          className="nav-item"
          style={{
            border: 'none', background: 'rgba(239,68,68,0.1)',
            color: 'var(--color-danger)', cursor: 'pointer',
            fontFamily: 'inherit', width: '100%', textAlign: 'left',
          }}
        >
          Sign Out
        </button>

        {/* ── User info ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 12px', marginTop: '12px',
          borderRadius: 'var(--radius-md)', background: 'var(--color-bg-hover)',
        }}>
          <div className="user-avatar" style={{ width: 32, height: 32, fontSize: '12px', flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--color-text-primary)' }}>
              {user.name}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {user.role === 'superadmin' ? 'Super Admin' : user.role}
            </div>
          </div>
        </div>

        {/* Bottom padding for mobile browser chrome */}
        <div style={{ height: '24px' }} />
      </nav>

    </aside>
  );
}
