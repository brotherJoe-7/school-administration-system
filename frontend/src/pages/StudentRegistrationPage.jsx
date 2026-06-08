import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import toast from 'react-hot-toast';

const FALLBACK_PROGRAMS = [
  { code: 'BIT',          name: 'Bachelor of Information Technology' },
  { code: 'BBIT',         name: 'Bachelor of Business Information Technology' },
  { code: 'BSEM',         name: 'Bachelor of Software Engineering & Management' },
  { code: 'BICT',         name: 'Bachelor of ICT' },
  { code: 'DAT',          name: 'Diploma in Applied Technology' },
  { code: 'BSc CS',       name: 'BSc Computer Science' },
  { code: 'BBA MIS',      name: 'BBA Management Information Systems' },
  { code: 'Diploma ICT',  name: 'Diploma in ICT' },
  { code: 'HND Computing',name: 'HND Computing' },
];

export default function StudentRegistrationPage() {
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(false);
  const [step, setStep]         = useState(1);
  const [programs, setPrograms] = useState([]);
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '', confirm_password: '',
    date_of_birth: '', gender: '', phone: '', address: '', nationality: 'Sierra Leonean',
    emergency_contact_name: '', emergency_contact_phone: '',
    program: '', year_of_study: '1', consent_gdpr: false,
  });

  // Fetch programs dynamically from database
  useEffect(() => {
    API.get('/classes/programs')
      .then(res => {
        const list = (res.data.data || []).map(p => ({ code: p, name: p }));
        setPrograms(list.length > 0 ? list : FALLBACK_PROGRAMS);
      })
      .catch(() => setPrograms(FALLBACK_PROGRAMS));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    if (!form.consent_gdpr) {
      toast.error('You must provide GDPR consent to register');
      return;
    }
    setLoading(true);
    try {
      const { data } = await API.post('/students/register', form);
      toast.success(`Registration submitted! Your student number: ${data.student_number}`);
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, name, type = 'text', required, options, placeholder }) => (
    <div className="form-group">
      <label className="form-label">
        {label}{required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
      </label>
      {options ? (
        <select className="form-select" value={form[name]} onChange={e => set(name, e.target.value)} required={required}>
          <option value="">Select {label}</option>
          {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
        </select>
      ) : (
        <input className="form-input" type={type} placeholder={placeholder || label}
          value={form[name]} onChange={e => set(name, e.target.value)} required={required} />
      )}
    </div>
  );

  const stepLabels = ['Personal Details', 'Academic Details', 'Review & Submit'];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)', padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: '#000000', border: '2px solid var(--color-border-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', fontSize: '20px', fontWeight: 900, color: '#fff',
          fontFamily: 'Outfit, sans-serif',
        }}>SAS</div>
        <h1 style={{ fontFamily: 'Outfit', fontSize: '28px', fontWeight: 900 }}>Student Registration</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '6px' }}>School Administration System</p>
      </div>

      {/* Step Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
        {[1, 2, 3].map(s => (
          <React.Fragment key={s}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '13px',
              background: step >= s ? '#000000' : 'var(--color-bg-hover)',
              color: step >= s ? '#fff' : 'var(--color-text-muted)',
              border: `2px solid ${step >= s ? '#000000' : 'var(--color-border)'}`,
              transition: 'all 0.2s',
            }}>{s}</div>
            {s < 3 && <div style={{ width: 40, height: 2, background: step > s ? '#000000' : 'var(--color-border)', borderRadius: 1, transition: 'all 0.2s' }} />}
          </React.Fragment>
        ))}
        <span style={{ marginLeft: '8px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          {stepLabels[step - 1]}
        </span>
      </div>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '680px' }}>

        {/* Step 1: Personal Details */}
        {step === 1 && (
          <div className="card" style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Personal Details</h2>
            <div className="form-grid">
              <Field label="First Name"  name="first_name"  required />
              <Field label="Last Name"   name="last_name"   required />
              <Field label="Email"       name="email"       type="email"     required />
              <Field label="Phone"       name="phone"       placeholder="+232 76 123 456" />
              <Field label="Password"         name="password"         type="password" required />
              <Field label="Confirm Password" name="confirm_password" type="password" required />
              <Field label="Date of Birth" name="date_of_birth" type="date" />
              <Field label="Gender" name="gender" options={[
                { value: 'male',            label: 'Male' },
                { value: 'female',          label: 'Female' },
                { value: 'other',           label: 'Other' },
                { value: 'prefer_not_to_say', label: 'Prefer not to say' },
              ]} />
              <Field label="Nationality" name="nationality" />
            </div>
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label className="form-label">Address</label>
              <textarea className="form-textarea" placeholder="Street address, Freetown..." value={form.address}
                onChange={e => set('address', e.target.value)} />
            </div>
            <div className="form-grid" style={{ marginTop: '12px' }}>
              <Field label="Emergency Contact Name"  name="emergency_contact_name" />
              <Field label="Emergency Contact Phone" name="emergency_contact_phone" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button type="button" className="btn btn-primary"
                style={{ backgroundColor: '#000000', borderColor: '#000000' }}
                onClick={() => {
                  if (!form.first_name || !form.last_name || !form.email || !form.password) {
                    toast.error('Please fill in all required fields');
                    return;
                  }
                  if (form.password !== form.confirm_password) {
                    toast.error('Passwords do not match');
                    return;
                  }
                  setStep(2);
                }}>
                Next: Academic Details
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Academic Details */}
        {step === 2 && (
          <div className="card" style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Academic Details</h2>

            <div className="form-group mb-16">
              <label className="form-label">
                Program <span style={{ color: 'var(--color-danger)' }}>*</span>
                {programs.length === 0 && (
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginLeft: '8px' }}>
                    Loading...
                  </span>
                )}
              </label>
              <select className="form-select" value={form.program}
                onChange={e => set('program', e.target.value)} required>
                <option value="">Select Program</option>
                {programs.map(p => (
                  <option key={p.code} value={p.code}>
                    {p.code === p.name ? p.code : `${p.code} — ${p.name}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group mb-16">
              <label className="form-label">Year of Study</label>
              <select className="form-select" value={form.year_of_study}
                onChange={e => set('year_of_study', e.target.value)}>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
            </div>

            {/* GDPR Consent Block */}
            <div style={{
              background: 'var(--color-bg-hover)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', padding: '16px', marginTop: '16px',
            }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>
                Data Privacy Consent (GDPR / Sierra Leone ICT Act)
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: '12px' }}>
                The School Administration System collects and processes your personal data (name, email, academic records)
                strictly for educational administration purposes. Your data is stored securely in encrypted form, is never
                sold or shared with unauthorised third parties, and you may request its deletion at any time by contacting
                the system administrator. This system complies with the Sierra Leone National ICT Policy (2017) and
                GDPR-equivalent data protection principles.
              </p>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.consent_gdpr}
                  onChange={e => set('consent_gdpr', e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: '#000000' }} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>
                  I consent to the collection and processing of my personal data
                  <span style={{ color: 'var(--color-danger)' }}> *</span>
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
              <button type="button" className="btn btn-primary"
                style={{ backgroundColor: '#000000', borderColor: '#000000' }}
                onClick={() => {
                  if (!form.program)       { toast.error('Please select a program'); return; }
                  if (!form.consent_gdpr)  { toast.error('GDPR consent is required to register'); return; }
                  setStep(3);
                }}>
                Review Application
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="card" style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Review Your Application</h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              {[
                ['Full Name',        `${form.first_name} ${form.last_name}`],
                ['Email',            form.email],
                ['Phone',            form.phone || '—'],
                ['Date of Birth',    form.date_of_birth || '—'],
                ['Gender',           form.gender || '—'],
                ['Nationality',      form.nationality],
                ['Program',          programs.find(p => p.code === form.program)?.name || form.program || '—'],
                ['Year of Study',    `Year ${form.year_of_study}`],
                ['Emergency Contact',form.emergency_contact_name || '—'],
                ['GDPR Consent',     form.consent_gdpr ? 'Granted' : 'Not granted'],
              ].map(([label, value]) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: '1px solid var(--color-border)',
                }}>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{
              background: 'var(--color-bg-hover)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', padding: '14px', marginTop: '16px',
            }}>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                After submission, your application will be reviewed by a system administrator.
                You will receive your Student Number and can log in once your registration is approved.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>Back</button>
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading}
                style={{ backgroundColor: '#000000', borderColor: '#000000' }}>
                {loading
                  ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Submitting...</>
                  : 'Submit Registration'}
              </button>
            </div>
          </div>
        )}
      </form>

      <p style={{ marginTop: '16px', fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
        Already registered?{' '}
        <a href="/login" style={{ color: 'var(--color-gold)' }}>Sign in here</a>
      </p>
    </div>
  );
}
