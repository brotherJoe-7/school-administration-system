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
    { label: 'AI Assistant',    path: '/ai',           icon: '' },
    { label: 'Settings',        path: '/settings',     icon: '' },
  ],
  superadmin: [
    { label: 'Platform Overview', path: '/platform', icon: '' },
    { label: 'AI Assistant',      path: '/ai',       icon: '' },
    { label: 'System Audit',      path: '/audit',    icon: '' },
    { label: 'Settings',          path: '/settings', icon: '' },
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
          <h2>School Administration System</h2>
          <span>Institutional Portal</span>
        </div>
      </div>

      {/* ── Navigation (scrollable) ── */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map((item) => (
          <NavLink
            key={item.path + item.label}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            {item.icon && <span style={{ fontSize: '15px', flexShrink: 0, lineHeight: 1 }}>{item.icon}</span>}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* ── Footer (always pinned at bottom) ── */}
      <div style={{
        flexShrink: 0,
        padding: '12px',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        paddingBottom: '20px', // Extra padding for mobile bottom bar clearance
      }}>

        {/* User pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 10px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-bg-hover)',
          marginBottom: '2px'
        }}>
          <div className="user-avatar" style={{ width: 28, height: 28, fontSize: '11px' }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.name}
            </div>
            <div style={{ fontSize: '9px', color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {user.role}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {/* View Website */}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)',
              fontSize: '12px',
              fontWeight: 500,
              textDecoration: 'none',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'all 0.15s',
              textAlign: 'center'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--color-bg-hover)';
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
          >
            Website
          </a>

          {/* Sign Out */}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: 'var(--color-danger)',
              fontSize: '12px',
              fontWeight: 600,
              background: 'rgba(239,68,68,0.1)',
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.15s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--color-danger)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
              e.currentTarget.style.color = 'var(--color-danger)';
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
