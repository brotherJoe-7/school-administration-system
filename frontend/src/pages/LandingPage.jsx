import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';

const BLUE = 'var(--color-gold, #F59E0B)';
const BLUE_DARK = 'var(--color-gold, #D97706)';
const BLUE_GLOW = 'var(--color-gold-muted, rgba(245,158,11,0.35))';
const BG = '#0a0a0a';
const BG2 = '#111111';
const BG_CARD = '#161616';

const features = [
  {
    title: 'Dynamic Dashboard',
    desc: 'Real-time analytics, financial overviews, and live stat cards customized per school tenant.',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="12" width="4" height="9"/><rect x="9" y="7" width="4" height="14"/>
        <rect x="15" y="3" width="4" height="18"/><line x1="3" y1="3" x2="21" y2="3"/>
      </svg>
    ),
  },
  {
    title: 'Smart Attendance',
    desc: 'Tick-box daily attendance with automated alerts when a student drops below thresholds.',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/>
      </svg>
    ),
  },
  {
    title: 'Payroll & Finance',
    desc: 'Automate salary disbursements, allowances, deductions, and tuition collection in one flow.',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 6v2m0 8v2M9 10c0-1.1.9-2 3-2s3 .9 3 2-1.3 2-3 2-3 .9-3 2 .9 2 3 2 3-.9 3-2"/>
      </svg>
    ),
  },
  {
    title: 'AI Assistant',
    desc: 'Ask questions in plain English. Get instant reports, predictions, and at-risk student flags.',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
  },
];

const programs = ['Information Technology', 'Business Administration', 'Engineering', 'Nursing'];
const checkList = ['Define custom credit hours', 'Dynamic teacher assignments', 'Automated GPA calculations', 'Instant transcript generation'];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [stats, setStats] = useState({ schools: 0, students: 0 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    
    // Fetch public stats
    API.get('/public/stats')
      .then(res => {
        const data = res.data;
        if (data && data.success) {
          setStats({ schools: data.data.schoolsOnboarded, students: data.data.studentsManaged });
        }
      })
      .catch(err => console.error('Error fetching stats:', err));

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const s = {
    page: { minHeight: '100vh', background: BG, color: '#fff', fontFamily: "'Inter', sans-serif" },

    // NAV
    nav: {
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
      transition: 'all 0.3s',
      background: scrolled ? 'rgba(10,10,10,0.97)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid #1f1f1f' : '1px solid transparent',
    },
    navInner: { maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    logo: { fontSize: 22, fontWeight: 900, fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.5px' },
    logoBlue: { color: BLUE },
    navLinks: { display: 'flex', alignItems: 'center', gap: 32, flex: 1, justifyContent: 'center' },
    navLink: { fontSize: 14, fontWeight: 500, color: '#aaa', textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer' },
    navRight: { display: 'flex', alignItems: 'center', gap: 16 },
    navCta: {
      padding: '9px 20px', background: BLUE, color: '#000',
      border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700,
      cursor: 'pointer', textDecoration: 'none',
      boxShadow: `0 0 20px ${BLUE_GLOW}`,
      transition: 'background 0.2s',
    },
    navLogin: { fontSize: 14, fontWeight: 500, color: '#ddd', textDecoration: 'none', borderLeft: '1px solid #2a2a2a', paddingLeft: 16 },
    hamburger: { background: 'none', border: '1px solid #2a2a2a', borderRadius: 8, padding: 8, color: '#aaa', cursor: 'pointer', display: 'none' },

    // HERO
    hero: { paddingTop: 140, paddingBottom: 100, textAlign: 'center', position: 'relative', overflow: 'hidden' },
    heroGrid: {
      position: 'absolute', inset: 0, opacity: 0.07,
      backgroundImage: 'linear-gradient(#3B82F6 1px, transparent 1px), linear-gradient(90deg, #3B82F6 1px, transparent 1px)',
      backgroundSize: '40px 40px',
    },
    heroFade: { position: 'absolute', inset: 0, background: 'linear-gradient(to top, #080808 10%, transparent 60%)' },
    heroContent: { position: 'relative', zIndex: 2, maxWidth: 900, margin: '0 auto', padding: '0 24px' },
    badge: {
      display: 'inline-flex', alignItems: 'center', gap: 8,
      background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)',
      color: BLUE, borderRadius: 999, padding: '6px 16px', fontSize: 13, fontWeight: 600,
      marginBottom: 28,
    },
    h1: { fontSize: 'clamp(36px, 6vw, 76px)', fontWeight: 900, lineHeight: 1.08, fontFamily: "'Outfit', sans-serif", margin: '0 0 24px' },
    h1Blue: { color: BLUE },
    heroSub: { fontSize: 'clamp(16px, 2.5vw, 20px)', color: '#888', maxWidth: 640, margin: '0 auto 44px', lineHeight: 1.7 },
    heroButtons: { display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' },
    btnPrimary: {
      padding: '14px 32px', background: BLUE, color: '#fff', border: 'none',
      borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer',
      textDecoration: 'none', display: 'inline-block',
      boxShadow: `0 0 40px ${BLUE_GLOW}`, transition: 'transform 0.2s, background 0.2s',
    },
    btnOutline: {
      padding: '14px 32px', background: 'transparent', color: '#ddd',
      border: '1px solid #333', borderRadius: 10, fontSize: 16, fontWeight: 700,
      cursor: 'pointer', textDecoration: 'none', display: 'inline-block', transition: 'border-color 0.2s, color 0.2s',
    },

    // FEATURES
    section: { padding: '96px 24px' },
    sectionDark: { padding: '96px 24px', background: '#0d0d0d', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a' },
    container: { maxWidth: 1200, margin: '0 auto' },
    sectionLabel: { fontSize: 13, fontWeight: 700, color: BLUE, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 },
    h2: { fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, fontFamily: "'Outfit', sans-serif", marginBottom: 16 },
    sectionSub: { fontSize: 18, color: '#777', maxWidth: 560, margin: '0 auto 64px' },
    grid4: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 },
    featureCard: {
      background: '#111', border: '1px solid #1f1f1f', borderRadius: 16, padding: 28,
      transition: 'border-color 0.25s, transform 0.25s',
      cursor: 'default',
    },
    featureIcon: {
      width: 46, height: 46, borderRadius: 12, background: '#1a1a1a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: BLUE, marginBottom: 18, flexShrink: 0,
    },
    featureTitle: { fontSize: 17, fontWeight: 700, marginBottom: 10, fontFamily: "'Outfit', sans-serif" },
    featureDesc: { fontSize: 14, color: '#777', lineHeight: 1.65 },

    // PROGRAMS
    grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 60, alignItems: 'center' },
    checkItem: { display: 'flex', alignItems: 'center', gap: 14, fontSize: 16, color: '#ccc', marginBottom: 16 },
    checkIcon: { color: BLUE, flexShrink: 0 },
    programCard: {
      background: '#111', border: '1px solid #1f1f1f', borderRadius: 20, padding: 28,
      position: 'relative', overflow: 'hidden',
    },
    programGlow: {
      position: 'absolute', top: -40, right: -40, width: 160, height: 160,
      background: BLUE_GLOW, borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none',
    },
    programRow: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: 12,
      padding: '14px 18px', marginBottom: 12, transition: 'border-color 0.2s',
    },
    programName: { fontSize: 15, fontWeight: 600 },
    programBadge: {
      fontSize: 12, fontWeight: 700, padding: '4px 12px',
      background: 'rgba(59,130,246,0.12)', color: BLUE,
      border: '1px solid rgba(59,130,246,0.25)', borderRadius: 999,
    },

    // TESTIMONIAL
    testimonialWrap: { maxWidth: 780, margin: '0 auto', textAlign: 'center' },
    quoteIcon: { color: '#1f4280', fontSize: 80, lineHeight: 1, marginBottom: 24, fontFamily: 'Georgia, serif' },
    quoteText: { fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 400, color: '#ddd', lineHeight: 1.6, marginBottom: 32, fontStyle: 'italic' },
    quoteName: { fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 },
    quoteRole: { fontSize: 14, color: '#555' },

    // CONTACT
    formCard: { background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 20, padding: 40, maxWidth: 680, margin: '0 auto' },
    formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 },
    label: { display: 'block', fontSize: 12, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 },
    input: {
      width: '100%', background: '#111', border: '1px solid #222', borderRadius: 10,
      padding: '12px 16px', color: '#fff', fontSize: 15, fontFamily: "'Inter', sans-serif",
      outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
    },
    textarea: {
      width: '100%', background: '#111', border: '1px solid #222', borderRadius: 10,
      padding: '12px 16px', color: '#fff', fontSize: 15, fontFamily: "'Inter', sans-serif",
      outline: 'none', resize: 'vertical', minHeight: 120, boxSizing: 'border-box',
      transition: 'border-color 0.2s',
    },
    submitBtn: {
      width: '100%', padding: '15px', background: BLUE, color: '#fff',
      border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700,
      cursor: 'pointer', marginTop: 8, boxShadow: `0 0 24px ${BLUE_GLOW}`,
      transition: 'background 0.2s',
    },

    // FOOTER
    footer: { background: '#080808', borderTop: '1px solid #141414', padding: '60px 24px 32px' },
    footerGrid: { maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 48 },
    footerLogo: { fontSize: 22, fontWeight: 900, fontFamily: "'Outfit', sans-serif", marginBottom: 14 },
    footerDesc: { fontSize: 14, color: '#555', lineHeight: 1.7, maxWidth: 280 },
    footerTitle: { fontSize: 12, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 },
    footerLink: { display: 'block', fontSize: 14, color: '#555', textDecoration: 'none', marginBottom: 12, transition: 'color 0.2s' },
    footerBottom: { maxWidth: 1200, margin: '0 auto', paddingTop: 28, borderTop: '1px solid #141414', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
    footerCopy: { fontSize: 13, color: '#3a3a3a' },
    footerSocial: { display: 'flex', gap: 20, alignItems: 'center' },
    footerSocialLink: { color: '#3a3a3a', textDecoration: 'none', transition: 'color 0.2s', display: 'flex', alignItems: 'center' },
    // stats
    statsBar: { background: '#0d0d0d', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a', padding: '40px 24px' },
    statsGrid: { maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 32, textAlign: 'center' },
    statNum: { fontSize: 40, fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: BLUE, lineHeight: 1 },
    statLabel: { fontSize: 13, color: '#666', marginTop: 8, fontWeight: 500 },
    // AI teaser
    aiCard: { background: '#0d0d0d', border: `1px solid ${BLUE}30`, borderRadius: 20, padding: '52px 40px', maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 48, alignItems: 'center' },
    aiIconWrap: { display: 'flex', flexDirection: 'column', gap: 16 },
    aiChatBubble: { background: '#111', border: '1px solid #1f1f1f', borderRadius: 14, padding: '14px 20px', fontSize: 14, color: '#ccc', lineHeight: 1.6 },
    aiChatUser: { background: `${BLUE}18`, border: `1px solid ${BLUE}30`, borderRadius: 14, padding: '14px 20px', fontSize: 14, color: '#93c5fd', lineHeight: 1.6, alignSelf: 'flex-end' },
  };

  return (
    <div style={s.page}>
      {/* Responsive CSS */}
      <style>{`
        .landing-hamburger { display: none !important; }
        .landing-nav-links { display: flex !important; }
        .landing-mobile-menu { display: none; }
        @media (max-width: 768px) {
          .landing-hamburger { display: flex !important; }
          .landing-nav-links { display: none !important; }
          .landing-mobile-menu { display: flex; }
        }
      `}</style>
      {/* NAV */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <span style={s.logo}><span style={s.logoBlue}>School</span>SaaS.</span>

          {/* Desktop links */}
          <div style={s.navLinks} className="landing-nav-links">
            <a href="#features" style={s.navLink}>Features</a>
            <a href="#programs" style={s.navLink}>Programs</a>
            <Link to="/pricing" style={s.navLink}>Pricing</Link>
            <Link to="/contact" style={s.navLink}>Contact Us</Link>
          </div>

          {/* Far right actions */}
          <div style={s.navRight} className="landing-nav-links">
            {localStorage.getItem('token') ? (
              <Link to="/dashboard" style={s.navCta}>Dashboard</Link>
            ) : (
              <>
                <Link to="/login" style={s.navLogin}>Login</Link>
                <Link to="/create-school" style={s.navCta}>Get Started</Link>
              </>
            )}
          </div>

          {/* Hamburger — mobile only via CSS */}
          <button style={s.hamburger} className="landing-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {menuOpen ? <path d="M6 18L18 6M6 6l12 12"/> : <path d="M3 12h18M3 6h18M3 18h18"/>}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        <div className="landing-mobile-menu" style={{ flexDirection: 'column', gap: 16, background: BG2, borderTop: '1px solid #1a1a1a', padding: '20px 24px', display: menuOpen ? 'flex' : 'none' }}>
            <a href="#features" style={{ fontSize: 16, color: '#ccc', textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#programs" style={{ fontSize: 16, color: '#ccc', textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>Programs</a>
            <Link to="/pricing" style={{ fontSize: 16, color: '#ccc', textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>Pricing</Link>
            <Link to="/contact" style={{ fontSize: 16, color: '#ccc', textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>Contact Us</Link>
            {localStorage.getItem('token') ? (
              <Link to="/dashboard" style={{ ...s.navCta, textAlign: 'center', display: 'block' }} onClick={() => setMenuOpen(false)}>Go to Dashboard</Link>
            ) : (
              <>
                <Link to="/login" style={{ fontSize: 16, color: '#ccc', textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>Login</Link>
                <Link to="/create-school" style={{ ...s.navCta, textAlign: 'center', display: 'block' }} onClick={() => setMenuOpen(false)}>Get Started</Link>
              </>
            )}
        </div>
      </nav>

      {/* HERO */}
      <section id="home" style={s.hero}>
        <div style={s.heroGrid} />
        <div style={s.heroFade} />
        <div style={s.heroContent}>
          <div style={s.badge}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            AI-Powered School Administration
          </div>
          <h1 style={s.h1}>The Operating System<br />for <span style={s.h1Blue}>Modern Schools</span>.</h1>
          <p style={s.heroSub}>Streamline administration, automate payroll, and boost academic performance with our secure, multi-tenant SaaS platform.</p>
          <div style={s.heroButtons}>
            <Link to="/create-school" style={s.btnPrimary}>Get Started for Free</Link>
            <a href="#features" style={s.btnOutline}>Explore Features</a>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={s.sectionDark}>
        <div style={s.container}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={s.sectionLabel}>Platform Features</p>
            <h2 style={{ ...s.h2, margin: '0 0 16px' }}>Everything in one place.</h2>
            <p style={{ ...s.sectionSub, margin: '0 auto' }}>A unified suite of tools to replace your fragmented legacy systems.</p>
          </div>
          <div style={s.grid4}>
            {features.map((f, i) => (
              <div key={i} style={s.featureCard}
                onMouseEnter={e => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1f1f1f'; e.currentTarget.style.transform = 'none'; }}>
                <div style={s.featureIcon}>{f.icon}</div>
                <h3 style={s.featureTitle}>{f.title}</h3>
                <p style={s.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROGRAMS */}
      <section id="programs" style={s.section}>
        <div style={s.container}>
          <div style={s.grid2}>
            <div>
              <p style={s.sectionLabel}>Academic Modules</p>
              <h2 style={{ ...s.h2, margin: '0 0 20px' }}>Customizable for any institution.</h2>
              <p style={{ fontSize: 17, color: '#777', lineHeight: 1.7, marginBottom: 36 }}>
                Whether you run an Engineering Faculty, a Business School, or K-12, SchoolSaaS adapts to your curriculum structure.
              </p>
              {checkList.map((item, i) => (
                <div key={i} style={s.checkItem}>
                  <svg style={s.checkIcon} width="20" height="20" fill="none" stroke={BLUE} strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                  {item}
                </div>
              ))}
            </div>
            <div style={s.programCard}>
              <div style={s.programGlow} />
              {programs.map((prog, i) => (
                <div key={i} style={s.programRow}
                  onMouseEnter={e => e.currentTarget.style.borderColor = BLUE}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#1f1f1f'}>
                  <span style={s.programName}>{prog}</span>
                  <span style={s.programBadge}>Active</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <div style={s.statsBar}>
        <div style={s.statsGrid}>
          {[[stats.schools, 'Schools Onboarded'],[stats.students, 'Students Managed'],['98%', 'Uptime SLA'],['4.9★', 'Admin Rating']].map(([num, label], i) => (
            <div key={i}>
              <div style={s.statNum}>{num}</div>
              <div style={s.statLabel}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TESTIMONIAL */}
      <section style={s.sectionDark}>
        <div style={s.testimonialWrap}>
          <div style={s.quoteIcon}>"</div>
          <p style={s.quoteText}>Switching to SchoolSaaS eliminated our paperwork entirely. The AI insights caught attendance issues before they became dropout statistics.</p>
          <div style={s.quoteName}>Dr. Sarah Jenkins</div>
          <div style={s.quoteRole}>Principal, Horizon Academy</div>
        </div>
      </section>

      {/* AI TEASER */}
      <section id="ai" style={s.section}>
        <div style={s.container}>
          <div style={s.aiCard}>
            <div>
              <p style={s.sectionLabel}>AI-Powered Intelligence</p>
              <h2 style={{ ...s.h2, margin: '0 0 20px' }}>Your school's smartest admin assistant.</h2>
              <p style={{ fontSize: 16, color: '#666', lineHeight: 1.75, marginBottom: 28 }}>
                Ask SchoolSaaS anything in plain English. Instantly surface attendance reports, flag at-risk students, generate payslips, or query tuition data — no SQL needed.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {['Natural language queries','Predictive dropout alerts','Auto-generated report cards','Payroll anomaly detection'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, color: '#aaa', marginBottom: 12 }}>
                    <svg width="18" height="18" fill="none" stroke={BLUE} strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div style={s.aiIconWrap}>
              <div style={s.aiChatUser}>"Which students have missed more than 3 classes this month?"</div>
              <div style={s.aiChatBubble}>📊 Found 12 students with 3+ absences in October. Top concern: <strong style={{ color: '#fff' }}>Year 2 IT</strong> — 8 absences avg. Want me to send alerts?</div>
              <div style={s.aiChatUser}>"Generate payroll summary for November."</div>
              <div style={s.aiChatBubble}>✅ November payroll: <strong style={{ color: '#fff' }}>Le 48.2M</strong> net across 34 teachers. 2 pending approvals. Download PDF?</div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" style={s.section}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <p style={s.sectionLabel}>Get In Touch</p>
          <h2 style={{ ...s.h2, margin: '0 0 12px' }}>Ready to transform your school?</h2>
          <p style={{ fontSize: 17, color: '#666' }}>Request a custom demo from our team.</p>
        </div>
        <div style={s.formCard}>
          <form onSubmit={e => e.preventDefault()}>
            <div style={s.formRow}>
              <div>
                <label style={s.label}>Name</label>
                <input type="text" placeholder="Jane Doe" style={s.input}
                  onFocus={e => e.target.style.borderColor = BLUE}
                  onBlur={e => e.target.style.borderColor = '#222'} />
              </div>
              <div>
                <label style={s.label}>Email</label>
                <input type="email" placeholder="jane@school.edu" style={s.input}
                  onFocus={e => e.target.style.borderColor = BLUE}
                  onBlur={e => e.target.style.borderColor = '#222'} />
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={s.label}>Message</label>
              <textarea placeholder="How can we help you?" style={s.textarea}
                onFocus={e => e.target.style.borderColor = BLUE}
                onBlur={e => e.target.style.borderColor = '#222'} />
            </div>
            <button type="submit" style={s.submitBtn}
              onMouseEnter={e => e.currentTarget.style.background = BLUE_DARK}
              onMouseLeave={e => e.currentTarget.style.background = BLUE}>
              Send Message
            </button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={s.footer}>
        <div style={s.footerGrid}>
          <div>
            <div style={s.footerLogo}><span style={s.logoBlue}>School</span>SaaS.</div>
            <p style={s.footerDesc}>Empowering educators with modern tools. Built for scalability, security, and global educational standards. Aligned with UN SDG 4.</p>
          </div>
          <div>
            <p style={s.footerTitle}>Platform</p>
            <a href="#features" style={s.footerLink}>Features</a>
            <a href="#programs" style={s.footerLink}>Programs</a>
            <Link to="/login" style={s.footerLink}>Login</Link>
            <Link to="/create-school" style={s.footerLink}>Create Account</Link>
          </div>
          <div>
            <p style={s.footerTitle}>Legal</p>
            <Link to="/privacy" style={s.footerLink}>Privacy Policy</Link>
            <Link to="/terms" style={s.footerLink}>Terms of Service</Link>
            <Link to="/gdpr" style={s.footerLink}>GDPR Consent</Link>
          </div>
        </div>
        <div style={s.footerBottom}>
          <span style={s.footerCopy}>&copy; 2026 SchoolSaaS Platform. All rights reserved. Aligned with UN SDG 4.</span>
          <div style={s.footerSocial}>
            <a href="#" style={s.footerSocialLink} title="Twitter" onMouseEnter={e=>e.currentTarget.style.color=BLUE} onMouseLeave={e=>e.currentTarget.style.color='#3a3a3a'}>
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 01-1.93.07 4.28 4.28 0 004 2.98 8.521 8.521 0 01-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/></svg>
            </a>
            <a href="#" style={s.footerSocialLink} title="LinkedIn" onMouseEnter={e=>e.currentTarget.style.color=BLUE} onMouseLeave={e=>e.currentTarget.style.color='#3a3a3a'}>
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
