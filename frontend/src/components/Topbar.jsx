import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Topbar({ title }) {
  const { user } = useAuth();
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-SL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">{title}</div>
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{dateStr}</p>
      </div>
      <div className="topbar-right">
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'var(--color-bg-hover)', padding: '6px 14px',
          borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)'
        }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Signed in as</span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-gold)' }}>{user?.name}</span>
          <span style={{
            fontSize: '10px', background: 'var(--color-gold-muted)',
            color: 'var(--color-gold)', padding: '2px 8px', borderRadius: 999,
            fontWeight: 700, textTransform: 'uppercase'
          }}>{user?.role}</span>
        </div>
      </div>
    </header>
  );
}
