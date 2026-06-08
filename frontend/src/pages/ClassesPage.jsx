import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import ProtectedLayout from '../components/ProtectedLayout';
import toast from 'react-hot-toast';


export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [programsList, setProgramsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ class_name:'', class_code:'', teacher_id:'', program:'', credit_hours:3, semester:'', schedule:'' });

  useEffect(() => {
    Promise.all([
      API.get('/classes'),
      API.get('/teachers'),
      API.get('/classes/programs'),
    ]).then(([c, t, p]) => {
      setClasses(c.data.data || []);
      setTeachers(t.data.data || []);
      setProgramsList(p.data.data || []);
    }).catch(() => toast.error('Failed to load classes'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await API.post('/classes', form);
      toast.success('Class created');
      setShowModal(false);
      const { data } = await API.get('/classes');
      setClasses(data.data || []);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <ProtectedLayout title="Classes">
      <div className="page-header">
        <div><h1>Classes</h1><p>{classes.length} classes registered</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Class</button>
      </div>

      <div className="card" style={{padding:0}}>
        <div className="table-wrapper">
          {loading ? <div className="loading-center"><div className="spinner"/></div> : (
            <table className="data-table">
              <thead><tr><th>Code</th><th>Class Name</th><th>Program</th><th>Teacher</th><th>Credits</th><th>Semester</th><th>Schedule</th><th>Enrolled</th></tr></thead>
              <tbody>
                {classes.length===0 ? (
                  <tr><td colSpan={8}><div className="empty-state"><p>No classes yet</p></div></td></tr>
                ) : classes.map(c => (
                  <tr key={c.id}>
                    <td><code style={{color:'var(--color-gold)',fontSize:'12px'}}>{c.class_code}</code></td>
                    <td style={{color:'#fff',fontWeight:600}}>{c.class_name}</td>
                    <td><span className="badge badge-info">{c.program}</span></td>
                    <td>{c.first_name} {c.last_name}</td>
                    <td style={{textAlign:'center'}}>{c.credit_hours}</td>
                    <td style={{fontSize:'13px',color:'var(--color-text-muted)'}}>{c.semester}</td>
                    <td style={{fontSize:'12px',color:'var(--color-text-muted)'}}>{c.schedule}</td>
                    <td style={{textAlign:'center',fontWeight:700,color:'var(--color-gold)'}}>{c.enrolled||0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Class</h3>
              <button className="btn btn-secondary btn-sm" onClick={()=>setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{display:'flex',flexDirection:'column',gap:'14px'}}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Class Name</label>
                    <input className="form-input" required value={form.class_name}
                      onChange={e=>setForm(f=>({...f,class_name:e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Class Code</label>
                    <input className="form-input" required placeholder="e.g. CS101" value={form.class_code}
                      onChange={e=>setForm(f=>({...f,class_code:e.target.value}))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Assign Teacher</label>
                  <select className="form-select" value={form.teacher_id}
                    onChange={e=>setForm(f=>({...f,teacher_id:e.target.value}))}>
                    <option value="">Unassigned</option>
                    {teachers.map(t=><option key={t.id} value={t.id}>{t.first_name} {t.last_name} — {t.department}</option>)}
                  </select>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Program</label>
                    <select className="form-select" required value={form.program}
                      onChange={e=>setForm(f=>({...f,program:e.target.value}))}>
                      <option value="">Select</option>
                      {programsList.map(p=><option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Credit Hours</label>
                    <input className="form-input" type="number" min="1" max="6" value={form.credit_hours}
                      onChange={e=>setForm(f=>({...f,credit_hours:e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Semester</label>
                    <input className="form-input" placeholder="e.g. 2024-Sem1" value={form.semester}
                      onChange={e=>setForm(f=>({...f,semester:e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Schedule</label>
                    <input className="form-input" placeholder="Mon/Wed 08:00-10:00" value={form.schedule}
                      onChange={e=>setForm(f=>({...f,schedule:e.target.value}))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Class</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}
