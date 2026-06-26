import React from 'react';
import { Link } from 'react-router-dom';

const PublicLayout = ({ title, children }) => (
  <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: "'Inter', sans-serif" }}>
    <nav style={{ borderBottom: '1px solid #1f1f1f', background: 'rgba(10,10,10,0.97)', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ textDecoration: 'none', fontSize: 20, fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: '#fff', letterSpacing: '-0.5px' }}>
          <span style={{ color: 'var(--color-gold, #F59E0B)' }}>School</span>SaaS.
        </Link>
        <Link to="/" style={{ fontSize: 14, color: '#aaa', textDecoration: 'none' }}>&larr; Back to Home</Link>
      </div>
    </nav>
    <div style={{ maxWidth: 800, margin: '60px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: 36, fontWeight: 900, fontFamily: "'Outfit', sans-serif", marginBottom: 32 }}>{title}</h1>
      <div style={{ lineHeight: 1.8, color: '#ccc' }}>
        {children}
      </div>
    </div>
  </div>
);

export const PrivacyPage = () => (
  <PublicLayout title="Privacy Policy">
    <p>Last updated: June 2026</p>
    <h3 style={{ marginTop: 24, color: '#fff' }}>1. Data Collection</h3>
    <p>We collect only the necessary information required to operate the School Administration System effectively. This includes student records, attendance data, and administrative information.</p>
    <h3 style={{ marginTop: 24, color: '#fff' }}>2. Data Usage</h3>
    <p>Your data is used strictly for the purpose of educational administration within your isolated tenant environment.</p>
    <h3 style={{ marginTop: 24, color: '#fff' }}>3. Data Protection</h3>
    <p>All data is encrypted in transit and at rest. We do not share your data with third parties without explicit consent.</p>
  </PublicLayout>
);

export const TermsPage = () => (
  <PublicLayout title="Terms of Service">
    <p>Last updated: June 2026</p>
    <h3 style={{ marginTop: 24, color: '#fff' }}>1. Acceptance of Terms</h3>
    <p>By accessing or using SchoolSaaS, you agree to be bound by these Terms of Service.</p>
    <h3 style={{ marginTop: 24, color: '#fff' }}>2. User Responsibilities</h3>
    <p>Users must maintain the confidentiality of their account credentials and are responsible for all activities that occur under their account.</p>
    <h3 style={{ marginTop: 24, color: '#fff' }}>3. Service Availability</h3>
    <p>We strive for 99.9% uptime but do not guarantee uninterrupted access to the platform.</p>
  </PublicLayout>
);

export const GDPRPage = () => (
  <PublicLayout title="GDPR Data Processing Agreement">
    <p>Last updated: June 2026</p>
    <h3 style={{ marginTop: 24, color: '#fff' }}>1. Processing of Personal Data</h3>
    <p>SchoolSaaS acts as a Data Processor on behalf of the School (the Data Controller). We process personal data only on documented instructions from the Controller.</p>
    <h3 style={{ marginTop: 24, color: '#fff' }}>2. Data Subject Rights</h3>
    <p>We provide tools to help the Controller respond to requests from Data Subjects exercising their rights under GDPR.</p>
    <h3 style={{ marginTop: 24, color: '#fff' }}>3. Security Measures</h3>
    <p>We implement appropriate technical and organizational measures to ensure a level of security appropriate to the risk.</p>
  </PublicLayout>
);

export const PricingPage = () => (
  <PublicLayout title="Pricing Plans">
    <p>Transparent pricing tailored for educational institutions of all sizes.</p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginTop: 40 }}>
      {[{ name: 'Starter', price: 'Free', features: ['Up to 100 students', 'Basic reporting', 'Email support'] },
        { name: 'Growth', price: '$29/mo', features: ['Up to 500 students', 'Advanced analytics', 'Priority support'] },
        { name: 'Enterprise', price: 'Custom', features: ['Unlimited students', 'Custom integrations', '24/7 SLA support'] }
      ].map(plan => (
        <div key={plan.name} style={{ background: '#111', border: '1px solid #1f1f1f', padding: 24, borderRadius: 12 }}>
          <h2 style={{ fontSize: 20, color: 'var(--color-gold, #F59E0B)', marginBottom: 8 }}>{plan.name}</h2>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 20 }}>{plan.price}</div>
          <ul style={{ listStyle: 'none', padding: 0, marginBottom: 20 }}>
            {plan.features.map(f => (
              <li key={f} style={{ marginBottom: 8, color: '#aaa', display: 'flex', gap: 8 }}>
                <span style={{ color: 'var(--color-gold, #F59E0B)' }}>✓</span> {f}
              </li>
            ))}
          </ul>
          {plan.name === 'Enterprise' && (
            <Link to="/contact" style={{ display: 'inline-block', marginTop: 12, padding: '8px 16px', border: '1px solid var(--color-gold, #F59E0B)', color: 'var(--color-gold, #F59E0B)', textDecoration: 'none', borderRadius: 8, fontWeight: 600 }}>
              Contact Sales
            </Link>
          )}
        </div>
      ))}
    </div>
  </PublicLayout>
);

export const ContactPage = () => (
  <PublicLayout title="Contact Us">
    <p>Get in touch with our team for support, custom enterprise plans, or general inquiries.</p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40, marginTop: 40 }}>
      <div style={{ background: '#111', border: '1px solid #1f1f1f', padding: 32, borderRadius: 12 }}>
        <h3 style={{ color: '#fff', marginBottom: 20 }}>Contact Information</h3>
        <p style={{ marginBottom: 16 }}><strong>Email:</strong> support@schoolsaas.com</p>
        <p style={{ marginBottom: 16 }}><strong>Phone:</strong> +1 (800) 123-4567</p>
        <p style={{ marginBottom: 16 }}><strong>Address:</strong> 123 Education Lane, Tech District, CA 94103</p>
      </div>
      <div style={{ background: '#111', border: '1px solid #1f1f1f', padding: 32, borderRadius: 12 }}>
        <h3 style={{ color: '#fff', marginBottom: 20 }}>Send a Message</h3>
        <form onSubmit={e => { e.preventDefault(); alert('Message sent!'); }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#aaa' }}>Name</label>
            <input type="text" required style={{ width: '100%', padding: '12px 16px', background: '#0a0a0a', border: '1px solid #222', borderRadius: 8, color: '#fff', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#aaa' }}>Email</label>
            <input type="email" required style={{ width: '100%', padding: '12px 16px', background: '#0a0a0a', border: '1px solid #222', borderRadius: 8, color: '#fff', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#aaa' }}>Message</label>
            <textarea required rows="4" style={{ width: '100%', padding: '12px 16px', background: '#0a0a0a', border: '1px solid #222', borderRadius: 8, color: '#fff', resize: 'vertical', boxSizing: 'border-box' }}></textarea>
          </div>
          <button type="submit" style={{ width: '100%', padding: '12px 16px', background: 'var(--color-gold, #F59E0B)', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Send Message</button>
        </form>
      </div>
    </div>
  </PublicLayout>
);
