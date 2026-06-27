import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NAV_ITEMS = {
  admin: [
    { label: 'Dashboard',      path: '/dashboard'  },
    { label: 'Students',       path: '/students'   },
    { label: 'Teachers',       path: '/teachers'   },
    { label: 'Classes',        path: '/classes'    },
    { label: 'Attendance',     path: '/attendance' },
    { label: 'Reports & GPA',  path: '/reports'    },
    { label: 'Payroll',        path: '/payroll'    },
    { label: 'Approval Queue', path: '/approvals'  },
    { label: 'Audit Log',      path: '/audit'      },
    { label: 'AI Assistant',   path: '/ai'         },
    { label: 'Settings',       path: '/settings'   },
  ],
  superadmin: [
    { label: 'Platform Overview', path: '/platform' },
    { label: 'AI Assistant',      path: '/ai'       },
    { label: 'System Audit',      path: '/audit'    },
    { label: 'Settings',          path: '/settings' },
  ],
  teacher: [
    { label: 'Dashboard',    path: '/dashboard'  },
    { label: 'My Classes',   path: '/classes'    },
    { label: 'Attendance',   path: '/attendance' },
    { label: 'Enter Grades', path: '/reports'    },
    { label: 'My Payslips',  path: '/payroll'    },
  ],
  student: [
    { label: 'Dashboard',     path: '/dashboard'  },
    { label: 'My Attendance', path: '/attendance' },
    { label: 'My Transcript', path: '/reports'    },
    { label: 'My Payments',   path: '/payments'   },
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
    <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        overflow: 'hidden',
      }}
    >

      {/* ── Logo ── */}
      <div className="sidebar-logo" style={{ flexShrink: 0 }}>
        <div className="sidebar-logo-icon">SAS</div>
        <div className="sidebar-logo-text">
          <h2>School Administration</h2>
          <span>Institutional Portal</span>
        </div>
      </div>

      {/* ── Scrollable nav ── */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 10px' }}>
        <div className="nav-section-label" style={{ padding: '8px 8px 6px' }}>Navigation</div>
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

      {/* ── Pinned Footer ── always visible, never clipped ── */}
      <div style={{
        flexShrink: 0,
        borderTop: '1px solid var(--color-border)',
        background: 'var(--color-bg-secondary)',
        padding: '10px 10px 14px',
      }}>

        {/* User pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 10px', borderRadius: 'var(--radius-md)',
          background: 'var(--color-bg-hover)', marginBottom: '8px',
        }}>
          <div className="user-avatar" style={{ width: 30, height: 30, fontSize: '11px', flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.name}
            </div>
            <div style={{ fontSize: '9px', color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {user.role === 'superadmin' ? 'Super Admin' : user.role}
            </div>
          </div>
        </div>

        {/* Action buttons row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '7px 4px', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)',
              fontSize: '11px', fontWeight: 500, textDecoration: 'none',
              textAlign: 'center', background: 'transparent',
            }}
          >
            View Website
          </a>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '7px 4px', borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(239,68,68,0.4)', color: 'var(--color-danger)',
              fontSize: '11px', fontWeight: 600, background: 'rgba(239,68,68,0.1)',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

    </aside>
  );
}
