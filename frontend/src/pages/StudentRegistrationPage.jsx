import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import toast from 'react-hot-toast';
import ProtectedLayout from '../components/ProtectedLayout';
import { programLabel } from '../utils/programs';

export default function StudentRegistrationPage() {
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(false);
  const [programs, setPrograms] = useState([]);
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '',
    date_of_birth: '', gender: '', phone: '', address: '', nationality: 'Sierra Leonean',
    emergency_contact_name: '', emergency_contact_phone: '',
    program: '', year_of_study: '1'
  });

  useEffect(() => {
    API.get('/classes/programs')
      .then(res => setPrograms(res.data.data || []))
      .catch(() => setPrograms(['Diploma in Information Technology (DIT)', 'B.Sc. (Hons) Information Technology', 'B.Sc. (Hons) Business Information Technology', 'B.Sc. (Hons) Software Engineering with Multimedia', 'B.Sc. (Hons) Information & Communication Technology']));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post('/students/register', form);
      toast.success(`Student registered successfully!`);
      // Show the ID to the admin securely
      window.prompt('Student Registration Successful! Share this ID with the student so they can setup their account:', data.student_number);
      navigate('/students');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, name, type = 'text', required, options }) => (
    <div className="form-group">
      <label className="form-label">{label}{required && <span style={{ color: 'var(--color-danger)' }}> *</span>}</label>
      {options ? (
        <select className="form-select" value={form[name]} onChange={e => set(name, e.target.value)} required={required}>
          <option value="">Select {label}</option>
          {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
        </select>
      ) : (
        <input className="form-input" type={type} value={form[name]} onChange={e => set(name, e.target.value)} required={required} />
      )}
    </div>
  );

  return (
    <ProtectedLayout title="Register Student" allowedRoles={['admin', 'teacher']}>
      <div className="page-header">
        <div>
          <h1>Register New Student</h1>
          <p>Create a student profile to allow them to set up their account</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Academic Info</h2>
          <div className="form-grid">
            <Field label="Program" name="program" options={programs.map(p => ({ value: p, label: programLabel(p) }))} required />
            <Field label="Year of Study" name="year_of_study" options={[1,2,3,4]} required />
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '30px 0 20px' }}>Personal Info</h2>
          <div className="form-grid">
            <Field label="First Name" name="first_name" required />
            <Field label="Last Name" name="last_name" required />
            <Field label="Email Address (Optional)" name="email" type="email" />
            <Field label="Phone" name="phone" />
            <Field label="Date of Birth" name="date_of_birth" type="date" required />
            <Field label="Gender" name="gender" options={[
              { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }
            ]} />
            <Field label="Nationality" name="nationality" />
          </div>
          
          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label">Address</label>
            <input className="form-input" value={form.address} onChange={e => set('address', e.target.value)} />
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '30px 0 20px' }}>Emergency Contact</h2>
          <div className="form-grid">
            <Field label="Contact Name" name="emergency_contact_name" />
            <Field label="Contact Phone" name="emergency_contact_phone" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Registering...' : 'Register Student'}
            </button>
          </div>
        </form>
      </div>
    </ProtectedLayout>
  );
}
