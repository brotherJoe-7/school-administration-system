import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import ProtectedLayout from '../components/ProtectedLayout';

import API from '../api/axios';

export default function SettingsPage() {
  const [color, setColor] = useState(() => localStorage.getItem('tenantColor') || '#F59E0B');
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('themeMode') || 'dark');
  const [idPrefix, setIdPrefix] = useState('');
  const [loadingPrefix, setLoadingPrefix] = useState(false);

  useEffect(() => {
    API.get('/settings/tenant')
      .then(res => {
        if (res.data.success && res.data.data.id_prefix) {
          setIdPrefix(res.data.data.id_prefix);
        }
      })
      .catch(err => console.error('Failed to load settings', err));
  }, []);

  const handleUpdatePrefix = async () => {
    setLoadingPrefix(true);
    try {
      await API.put('/settings/tenant', { id_prefix: idPrefix });
      toast.success('Student ID Prefix updated successfully!');
    } catch (err) {
      toast.error('Failed to update ID Prefix');
    }
    setLoadingPrefix(false);
  };

  const presetColors = [
    { name: 'Gold', value: '#F59E0B' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' },
  ];

  const handleColorChange = (newColor) => {
    setColor(newColor);
    localStorage.setItem('tenantColor', newColor);
    document.documentElement.style.setProperty('--color-gold', newColor);
    // Also set related variants
    const rgb = hexToRgb(newColor);
    if(rgb) {
      document.documentElement.style.setProperty('--color-gold-muted', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
    }
    toast.success('Theme color updated successfully');
  };

  const handleThemeChange = (mode) => {
    setThemeMode(mode);
    localStorage.setItem('themeMode', mode);
    if (mode === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    toast.success('Theme mode updated successfully');
  };

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
  }

  // Effect to apply color on mount is in App.jsx, but we can do it here too just in case
  useEffect(() => {
    document.documentElement.style.setProperty('--color-gold', color);
  }, [color]);

  return (
    <ProtectedLayout>
      <div className="page-header">
        <div>
          <h1>System Settings</h1>
          <p>Configure your school tenant preferences and styling.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 600, marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16 }}>School Identity Settings</h3>
        <p className="text-muted" style={{ marginBottom: 24 }}>Configure custom identifiers for your institution.</p>
        
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>Student ID Prefix</label>
          <div style={{ display: 'flex', gap: 12 }}>
            <input 
              type="text" 
              className="form-input" 
              value={idPrefix} 
              onChange={(e) => setIdPrefix(e.target.value)}
              placeholder="e.g. 90500"
              style={{ width: 200 }}
            />
            <button 
              className="btn btn-primary" 
              onClick={handleUpdatePrefix}
              disabled={loadingPrefix}
            >
              {loadingPrefix ? 'Saving...' : 'Save Prefix'}
            </button>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: 8 }}>
            New students will automatically be assigned an ID starting with this prefix (e.g., {idPrefix || '90500'}0001).
          </p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <h3 style={{ marginBottom: 16 }}>Theme Customization</h3>
        <p className="text-muted" style={{ marginBottom: 24 }}>Select a primary accent color for your institution's dashboard.</p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          {presetColors.map(c => (
            <button
              key={c.value}
              onClick={() => handleColorChange(c.value)}
              style={{
                width: 48, height: 48, borderRadius: '50%', backgroundColor: c.value,
                border: color === c.value ? '4px solid #fff' : '2px solid transparent',
                cursor: 'pointer', outline: `2px solid ${color === c.value ? c.value : 'transparent'}`,
                outlineOffset: 2, transition: 'all 0.2s'
              }}
              title={c.name}
            />
          ))}
        </div>

        <div style={{ marginBottom: 32 }}>
          <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>Interface Theme</label>
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              onClick={() => handleThemeChange('dark')} 
              className={`btn ${themeMode === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Dark Mode
            </button>
            <button 
              onClick={() => handleThemeChange('light')} 
              className={`btn ${themeMode === 'light' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Light Mode
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>Custom Hex Color</label>
          <div style={{ display: 'flex', gap: 12 }}>
            <input 
              type="color" 
              value={color} 
              onChange={(e) => handleColorChange(e.target.value)}
              style={{ width: 48, height: 48, padding: 0, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'none' }}
            />
            <input 
              type="text" 
              className="form-input" 
              value={color} 
              onChange={(e) => handleColorChange(e.target.value)}
              style={{ width: 120 }}
            />
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
