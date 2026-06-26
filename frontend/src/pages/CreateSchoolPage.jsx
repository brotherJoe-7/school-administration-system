import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import API from '../api/axios';

const GOLD = 'var(--color-gold, #F59E0B)';
const GOLD_DARK = 'var(--color-gold, #D97706)';
const GOLD_GLOW = 'var(--color-gold-muted, rgba(245,158,11,0.25))';
const BG = '#0a0a0a';
const BG_CARD = '#111111';
const BORDER = '#1f1f1f';

const Field = ({ label, children, hint }) => (
  <div style={{ marginBottom: 20 }}>
    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
      {label}
    </label>
    {children}
    {hint && <p style={{ fontSize: 12, color: '#555', marginTop: 6 }}>{hint}</p>}
  </div>
);

const inputStyle = (focused) => ({
  width: '100%', boxSizing: 'border-box',
  background: '#0d0d0d', border: `1px solid ${focused ? GOLD : BORDER}`,
  borderRadius: 10, padding: '12px 16px', color: '#fff',
  fontSize: 15, fontFamily: "'Inter', sans-serif", outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  boxShadow: focused ? `0 0 0 3px ${GOLD_GLOW}` : 'none',
});

const plans = [
  { id: 'starter', label: 'Starter', price: 'Free', period: '', desc: 'Up to 100 students', highlight: false },
  { id: 'growth', label: 'Growth', price: '$29', period: '/mo', desc: 'Up to 500 students', highlight: true },
  { id: 'enterprise', label: 'Enterprise', price: 'Custom', period: '', desc: 'Unlimited + SLA', highlight: false },
];

export default function CreateSchoolPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ schoolName: '', subdomain: '', adminName: '', adminEmail: '', password: '', plan: 'starter', themeColor: '#F59E0B' });
  const [focused, setFocused] = useState('');
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(false);

  const handleChange = (e) => {
    const val = e.target.name === 'subdomain' ? e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') : e.target.value;
    setFormData({ ...formData, [e.target.name]: val });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!consent) { toast.error('Please accept the terms and consent to continue.'); return; }
    setLoading(true);
    try {
      await API.post('/auth/create-tenant', formData);
      localStorage.setItem('tenantColor', formData.themeColor); // Save custom color globally
      document.documentElement.style.setProperty('--color-gold', formData.themeColor);
      toast.success('School environment created! Redirecting to login…');
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create account');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter', sans-serif", color: '#fff' }}>

      {/* ── Navbar ── */}
      <nav style={{ borderBottom: `1px solid ${BORDER}`, background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 28px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ textDecoration: 'none', fontSize: 20, fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: '#fff', letterSpacing: '-0.5px', flexShrink: 0 }}>
            <span style={{ color: GOLD }}>School</span>SaaS.
          </Link>

          {/* Step Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#555' }}>
            {[['Create Account', true], ['Verify Email', false], ['Launch', false]].map(([label, active], i) => (
              <React.Fragment key={i}>
                {i > 0 && <span style={{ color: '#252525', fontSize: 16 }}>──</span>}
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: active ? GOLD : '#444', fontWeight: active ? 700 : 400 }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: active ? GOLD : 'transparent', border: active ? 'none' : '1px solid #2a2a2a', color: active ? '#000' : '#444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>{i + 1}</span>
                  <span className="landing-step-label">{label}</span>
                </span>
              </React.Fragment>
            ))}
          </div>

          <div style={{ fontSize: 13, color: '#555', flexShrink: 0 }}>
            Have an account?{' '}<Link to="/login" style={{ color: GOLD, fontWeight: 600, textDecoration: 'none' }}>Login</Link>
          </div>
        </div>
      </nav>

      {/* Responsive: hide step labels on mobile */}
      <style>{`.landing-step-label { display: inline; } @media (max-width: 600px) { .landing-step-label { display: none; } }`}</style>

      {/* ── Main ── */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 20px 80px' }}>
        <div style={{ width: '100%', maxWidth: 580 }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: `0 8px 24px ${GOLD_GLOW}` }}>
              <svg width="24" height="24" fill="none" stroke="#000" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 10v11M16 10v11M12 10v11"/>
              </svg>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, fontFamily: "'Outfit', sans-serif", margin: '0 0 8px' }}>Create Your School Account</h1>
            <p style={{ fontSize: 14, color: '#555' }}>Secure, isolated SaaS environment set up in minutes.</p>
          </div>

          {/* Form Card */}
          <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: '32px 36px', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
            <form onSubmit={handleSubmit}>

              {/* 1 — Plan */}
              <p style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>1. Choose Your Plan</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 28 }}>
                {plans.map(p => (
                  <div key={p.id} onClick={() => setFormData({ ...formData, plan: p.id })}
                    style={{ border: `1px solid ${formData.plan === p.id ? GOLD : BORDER}`, borderRadius: 12, padding: '16px 8px', cursor: 'pointer', background: formData.plan === p.id ? 'rgba(245,158,11,0.07)' : '#0d0d0d', textAlign: 'center', transition: 'all 0.2s', position: 'relative', boxShadow: formData.plan === p.id ? `0 0 0 2px ${GOLD_GLOW}` : 'none' }}>
                    {p.highlight && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: GOLD, color: '#000', fontSize: 10, fontWeight: 800, padding: '2px 10px', borderRadius: 99, whiteSpace: 'nowrap' }}>POPULAR</div>}
                    <div style={{ fontSize: 11, fontWeight: 700, color: formData.plan === p.id ? GOLD : '#666', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{p.label}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2 }}>
                      <span style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{p.price}</span>
                      <span style={{ fontSize: 12, color: '#555' }}>{p.period}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>{p.desc}</div>
                  </div>
                ))}
              </div>

              <hr style={{ border: 'none', borderTop: `1px solid ${BORDER}`, margin: '0 0 24px' }} />

              {/* 2 — School Details */}
              <p style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>2. School Details</p>

              <Field label="Institution Name" hint="Appears on all reports and student portals.">
                <input type="text" name="schoolName" value={formData.schoolName} onChange={handleChange} required placeholder="e.g. Rising Academy" style={inputStyle(focused === 'schoolName')} onFocus={() => setFocused('schoolName')} onBlur={() => setFocused('')} />
              </Field>

              <Field label="Subdomain" hint={`Portal URL: ${formData.subdomain || 'yourschool'}.schoolsaas.com`}>
                <div style={{ display: 'flex' }}>
                  <input type="text" name="subdomain" value={formData.subdomain} onChange={handleChange} required placeholder="rising" style={{ ...inputStyle(focused === 'subdomain'), borderRadius: '10px 0 0 10px', borderRight: 'none' }} onFocus={() => setFocused('subdomain')} onBlur={() => setFocused('')} />
                  <span style={{ background: '#0d0d0d', border: `1px solid ${focused === 'subdomain' ? GOLD : BORDER}`, borderLeft: 'none', borderRadius: '0 10px 10px 0', padding: '0 12px', display: 'flex', alignItems: 'center', color: '#555', fontSize: 13, whiteSpace: 'nowrap', transition: 'border-color 0.2s' }}>.schoolsaas.com</span>
                </div>
              </Field>

              <hr style={{ border: 'none', borderTop: `1px solid ${BORDER}`, margin: '4px 0 24px' }} />

              {/* 3 — Admin Credentials */}
              <p style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>3. Admin Credentials</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Full Name">
                  <input type="text" name="adminName" value={formData.adminName} onChange={handleChange} required placeholder="Jane Doe" style={inputStyle(focused === 'adminName')} onFocus={() => setFocused('adminName')} onBlur={() => setFocused('')} />
                </Field>
                <Field label="Email Address">
                  <input type="email" name="adminEmail" value={formData.adminEmail} onChange={handleChange} required placeholder="admin@school.edu" style={inputStyle(focused === 'adminEmail')} onFocus={() => setFocused('adminEmail')} onBlur={() => setFocused('')} />
                </Field>
              </div>

              <Field label="Password" hint="Minimum 8 characters.">
                <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={8} placeholder="••••••••" style={inputStyle(focused === 'password')} onFocus={() => setFocused('password')} onBlur={() => setFocused('')} />
              </Field>

              <Field label="School Theme Color" hint="Pick a primary accent color for your school dashboard.">
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input type="color" name="themeColor" value={formData.themeColor} onChange={handleChange} style={{ width: 42, height: 42, padding: 0, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'none' }} />
                  <span style={{ fontSize: 14, color: '#aaa' }}>{formData.themeColor}</span>
                </div>
              </Field>

              <hr style={{ border: 'none', borderTop: `1px solid ${BORDER}`, margin: '4px 0 24px' }} />

              {/* GDPR Consent */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ marginTop: 3, width: 16, height: 16, accentColor: GOLD, flexShrink: 0, cursor: 'pointer' }} />
                  <span style={{ fontSize: 13, color: '#666', lineHeight: 1.7 }}>
                    I confirm I am authorized to create this account and agree to the{' '}
                    <a href="#" style={{ color: GOLD, textDecoration: 'none', fontWeight: 600 }}>Terms of Service</a>,{' '}
                    <a href="#" style={{ color: GOLD, textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</a>, and{' '}
                    <a href="#" style={{ color: GOLD, textDecoration: 'none', fontWeight: 600 }}>GDPR Data Processing Agreement</a>.
                  </span>
                </label>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading || !consent}
                style={{ width: '100%', padding: '14px', background: (!consent || loading) ? '#1a1a1a' : GOLD, color: (!consent || loading) ? '#444' : '#000', border: `1px solid ${(!consent || loading) ? BORDER : GOLD}`, borderRadius: 10, fontSize: 16, fontWeight: 800, cursor: (!consent || loading) ? 'not-allowed' : 'pointer', boxShadow: (!consent || loading) ? 'none' : `0 0 24px ${GOLD_GLOW}`, transition: 'all 0.2s', fontFamily: "'Inter', sans-serif" }}
                onMouseEnter={e => { if (consent && !loading) e.currentTarget.style.background = GOLD_DARK; }}
                onMouseLeave={e => { if (consent && !loading) e.currentTarget.style.background = GOLD; }}>
                {loading ? 'Deploying environment…' : 'Deploy My School Environment →'}
              </button>
            </form>
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#333', marginTop: 20 }}>
            🔒 Fully isolated encrypted environment — data never shared across tenants.
          </p>
        </div>
      </div>
    </div>
  );
}
