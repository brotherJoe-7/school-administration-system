import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import ProtectedLayout from '../components/ProtectedLayout';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const gradeColor = (g) => {
  if (!g) return 'var(--color-text-muted)';
  if (g.startsWith('A')) return 'var(--color-success)';
  if (g.startsWith('B')) return 'var(--color-info, #3b82f6)';
  if (g.startsWith('C')) return 'var(--color-warning)';
  return 'var(--color-danger)';
};

const gpaColor = (gpa) => {
  const v = parseFloat(gpa);
  if (v >= 3.5) return 'var(--color-success)';
  if (v >= 2.5) return 'var(--color-warning)';
  return 'var(--color-danger)';
};

const GRADES = ['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','F'];

export default function ReportsPage() {
  const { user } = useAuth();
  const [transcriptId, setTranscriptId] = useState(user?.role === 'student' ? user.id : '');
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradeForm, setGradeForm] = useState({ student_id:'', class_id:'', semester:'', grade:'', score:'', comments:'' });
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (user?.role !== 'student') {
      API.get('/students?limit=200&status=active').then(r => setStudents(r.data.data || [])).catch(() => {});
      API.get('/classes').then(r => setClasses(r.data.data || [])).catch(() => {});
    }
    if (user?.role === 'student' && user.id) loadTranscript(user.id);
  }, [user]);

  const loadTranscript = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await API.get(`/reports/student/${id}/transcript`);
      setTranscript(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load transcript');
      setTranscript(null);
    } finally {
      setLoading(false);
    }
  };

  const submitGrade = async (e) => {
    e.preventDefault();
    try {
      await API.post('/reports/cards', gradeForm);
      toast.success('Grade recorded successfully');
      setShowGradeModal(false);
      setGradeForm({ student_id:'', class_id:'', semester:'', grade:'', score:'', comments:'' });
      if (gradeForm.student_id === transcriptId) loadTranscript(transcriptId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record grade');
    }
  };

  const requestTranscript = async () => {
    setRequesting(true);
    try {
      await API.post('/reports/transcripts/request', {});
      toast.success('Transcript request submitted! Awaiting admin approval.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
    } finally {
      setRequesting(false);
    }
  };

  const exportCSV = () => {
    if (!transcript) return;
    const { student, semesters } = transcript;
    let csv = `data:text/csv;charset=utf-8,`;
    csv += `Student Name,${student.first_name} ${student.last_name}\n`;
    csv += `Student Number,${student.student_number}\n`;
    csv += `Program,${student.program || 'N/A'}\n`;
    csv += `Cumulative GPA,${transcript.cumulative_gpa}\n`;
    csv += `Total Credits,${transcript.total_credits}\n\n`;
    csv += `Semester,Class Code,Class Name,Credits,Score,Grade,Comments\n`;
    Object.entries(semesters).forEach(([sem, data]) => {
      data.grades.forEach(g => {
        csv += [sem, g.class_code, `"${(g.class_name||'').replace(/"/g,'""')}"`,
          g.credit_hours, g.score ? `${g.score}%` : '—', g.grade || '—',
          `"${(g.comments||'').replace(/"/g,'""')}"`].join(',') + '\n';
      });
    });
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `Transcript_${student.student_number}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const exportPDF = () => {
    if (!transcript) return;
    const { student, semesters } = transcript;
    const now = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' });

    let semHtml = '';
    Object.entries(semesters).forEach(([sem, data]) => {
      let rows = data.grades.map(g => `
        <tr>
          <td style="font-weight:600">${g.class_code || '—'}</td>
          <td>${g.class_name || '—'}</td>
          <td style="text-align:center">${g.credit_hours}</td>
          <td style="text-align:center">${g.score != null ? g.score + '%' : '—'}</td>
          <td style="text-align:center;font-weight:800;font-size:15px">${g.grade || '—'}</td>
        </tr>`).join('');
      semHtml += `
        <div style="margin-bottom:24px">
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1.5px solid #000;padding-bottom:5px;margin-bottom:8px">
            <span style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">Semester: ${sem}</span>
            <span style="font-size:12px">Semester GPA: <strong>${data.gpa}</strong> &nbsp;|&nbsp; Credits: <strong>${data.total_credits}</strong></span>
          </div>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#f0f0f0">
                <th style="padding:7px 10px;font-size:11px;text-align:left;text-transform:uppercase;border-bottom:1px solid #ccc">Code</th>
                <th style="padding:7px 10px;font-size:11px;text-align:left;text-transform:uppercase;border-bottom:1px solid #ccc">Course Name</th>
                <th style="padding:7px 10px;font-size:11px;text-align:center;text-transform:uppercase;border-bottom:1px solid #ccc">Cr. Hrs</th>
                <th style="padding:7px 10px;font-size:11px;text-align:center;text-transform:uppercase;border-bottom:1px solid #ccc">Score</th>
                <th style="padding:7px 10px;font-size:11px;text-align:center;text-transform:uppercase;border-bottom:1px solid #ccc">Grade</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    });

    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Official Transcript – ${student.student_number}</title>
  <style>
    @page { size: A4; margin: 18mm 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Times New Roman', Times, serif; color: #000; background: #fff; font-size: 13px; }
    td, th { padding: 7px 10px; border-bottom: 1px solid #ddd; }
    tbody tr:nth-child(even) { background: #fafafa; }
    @media print { body { -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div style="text-align:center;border-bottom:3px double #000;padding-bottom:14px;margin-bottom:18px">
    <div style="font-size:22px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase">School Administration System</div>
    <div style="font-size:12px;color:#444;margin-top:3px">Institutional Academic Registry · Sierra Leone</div>
    <div style="font-size:17px;font-weight:700;margin-top:10px;text-transform:uppercase;letter-spacing:0.1em;border-top:1px solid #ccc;padding-top:10px">Official Academic Transcript</div>
  </div>

  <div style="display:flex;justify-content:space-between;margin-bottom:18px;gap:20px">
    <table style="font-size:12.5px;border-collapse:collapse;flex:1">
      <tr><td style="padding:4px 8px 4px 0;color:#555;border:none;white-space:nowrap">Student Name</td><td style="padding:4px 0;font-weight:700;border:none">${student.first_name} ${student.last_name}</td></tr>
      <tr><td style="padding:4px 8px 4px 0;color:#555;border:none;white-space:nowrap">Student ID</td><td style="padding:4px 0;font-weight:600;border:none">${student.student_number}</td></tr>
      <tr><td style="padding:4px 8px 4px 0;color:#555;border:none;white-space:nowrap">Program</td><td style="padding:4px 0;border:none">${student.program || 'N/A'}</td></tr>
      <tr><td style="padding:4px 8px 4px 0;color:#555;border:none;white-space:nowrap">Year of Study</td><td style="padding:4px 0;border:none">${student.year_of_study || '—'}</td></tr>
      <tr><td style="padding:4px 8px 4px 0;color:#555;border:none;white-space:nowrap">Nationality</td><td style="padding:4px 0;border:none">${student.nationality || 'Sierra Leonean'}</td></tr>
      <tr><td style="padding:4px 8px 4px 0;color:#555;border:none;white-space:nowrap">Date Issued</td><td style="padding:4px 0;border:none">${now}</td></tr>
    </table>
    <div style="border:2px solid #000;border-radius:6px;padding:14px 22px;text-align:center;min-width:160px">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#555;margin-bottom:4px">Cumulative GPA</div>
      <div style="font-size:36px;font-weight:900">${transcript.cumulative_gpa}</div>
      <div style="font-size:11px;margin-top:6px;border-top:1px solid #ccc;padding-top:6px">
        Total Credits: <strong>${transcript.total_credits}</strong>
      </div>
      <div style="font-size:11px;margin-top:4px">
        Attendance: <strong>${transcript.attendance_percentage}%</strong>
      </div>
    </div>
  </div>

  <div style="border-top:2px solid #000;padding-top:16px;margin-bottom:8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em">Academic Record</div>

  ${semHtml || '<p style="color:#888;font-style:italic">No grades recorded.</p>'}

  <div style="margin-top:40px;border-top:1px solid #000;padding-top:14px;display:flex;justify-content:space-between;font-size:11px">
    <div>
      <div style="margin-bottom:30px">Registrar's Signature: ______________________</div>
      <div>Date: ______________________</div>
    </div>
    <div style="text-align:right;color:#555">
      <div>School Administration System</div>
      <div>Official Academic Record</div>
      <div style="margin-top:4px;font-size:10px">Generated: ${now}</div>
    </div>
  </div>

  <div style="margin-top:14px;border-top:1px dashed #aaa;padding-top:8px;font-size:10px;color:#888;text-align:center">
    CONFIDENTIAL — This transcript is only valid with the official stamp and signature of the Registrar.
  </div>

  <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}}</script>
</body>
</html>`);
    w.document.close();
  };

  return (
    <ProtectedLayout title="Academic Reports">
      <div className="page-header">
        <div>
          <h1>Academic Reports &amp; Transcripts</h1>
          <p>GPA calculation, semester grades and cumulative records</p>
        </div>
        <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
          {(user?.role === 'admin' || user?.role === 'teacher') && (
            <button className="btn btn-primary" onClick={() => setShowGradeModal(true)}>+ Enter Grade</button>
          )}
          {transcript && (
            <>
              <button className="btn btn-secondary" onClick={exportCSV}>Export CSV</button>
              <button className="btn btn-secondary" onClick={exportPDF}>🖨 Print Transcript</button>
            </>
          )}
          {user?.role === 'student' && (
            <button className="btn btn-secondary" onClick={requestTranscript} disabled={requesting}>
              {requesting ? 'Requesting...' : 'Request Official Copy'}
            </button>
          )}
        </div>
      </div>

      {/* Student Selector */}
      {user?.role !== 'student' && (
        <div className="card mb-20" style={{ padding:'16px 20px' }}>
          <div style={{ display:'flex', gap:'12px', alignItems:'flex-end', flexWrap:'wrap' }}>
            <div className="form-group" style={{ flex:1, minWidth:'200px', marginBottom:0 }}>
              <label className="form-label">Select Student</label>
              <select className="form-select" value={transcriptId} onChange={e => setTranscriptId(e.target.value)}>
                <option value="">-- Select a student --</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.student_number} — {s.first_name} {s.last_name}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" onClick={() => loadTranscript(transcriptId)} disabled={!transcriptId}>
              Load Transcript
            </button>
          </div>
        </div>
      )}

      {loading && <div className="loading-center"><div className="spinner" /></div>}

      {/* A4 Transcript Preview */}
      {transcript && !loading && (
        <div className="transcript-scroll">
        <div style={{ display:'flex', justifyContent:'center', padding:'0 0 40px' }}>
          <div style={{
            width:'794px', maxWidth:'100%', background:'#fff', color:'#000',
            boxShadow:'0 4px 40px rgba(0,0,0,0.35)',
            borderRadius:'4px', padding:'40px 48px',
            fontFamily:"'Times New Roman', Times, serif",
            fontSize:'13px', lineHeight:'1.6'
          }}>
            {/* Header */}
            <div style={{ textAlign:'center', borderBottom:'3px double #000', paddingBottom:'14px', marginBottom:'20px' }}>
              <div style={{ fontSize:'20px', fontWeight:900, letterSpacing:'0.08em', textTransform:'uppercase' }}>
                School Administration System
              </div>
              <div style={{ fontSize:'11px', color:'#555', marginTop:'3px' }}>
                Institutional Academic Registry · Sierra Leone
              </div>
              <div style={{ fontSize:'16px', fontWeight:700, marginTop:'10px', letterSpacing:'0.08em',
                textTransform:'uppercase', borderTop:'1px solid #ccc', paddingTop:'10px' }}>
                Official Academic Transcript
              </div>
            </div>

            {/* Student Info + GPA Box */}
            <div style={{ display:'flex', justifyContent:'space-between', gap:'24px', marginBottom:'20px', flexWrap:'wrap' }}>
              <table style={{ fontSize:'12.5px', borderCollapse:'collapse', flex:1 }}>
                {[
                  ['Student Name', `${transcript.student.first_name} ${transcript.student.last_name}`],
                  ['Student ID', transcript.student.student_number],
                  ['Program', transcript.student.program || 'N/A'],
                  ['Year of Study', transcript.student.year_of_study || '—'],
                  ['Nationality', transcript.student.nationality || 'Sierra Leonean'],
                  ['Date Issued', new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' })],
                ].map(([label, val]) => (
                  <tr key={label}>
                    <td style={{ padding:'3px 12px 3px 0', color:'#555', whiteSpace:'nowrap', verticalAlign:'top' }}>{label}</td>
                    <td style={{ padding:'3px 0', fontWeight: label === 'Student Name' || label === 'Student ID' ? 700 : 400 }}>{val}</td>
                  </tr>
                ))}
              </table>

              <div style={{ border:'2px solid #000', borderRadius:'6px', padding:'14px 20px',
                textAlign:'center', minWidth:'150px', alignSelf:'flex-start' }}>
                <div style={{ fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.08em', color:'#555', marginBottom:'4px' }}>
                  Cumulative GPA
                </div>
                <div style={{ fontSize:'34px', fontWeight:900, color: gpaColor(transcript.cumulative_gpa) }}>
                  {transcript.cumulative_gpa}
                </div>
                <div style={{ fontSize:'11px', marginTop:'6px', borderTop:'1px solid #ccc', paddingTop:'6px' }}>
                  Total Credits: <strong>{transcript.total_credits}</strong>
                </div>
                <div style={{ fontSize:'11px', marginTop:'4px' }}>
                  Attendance: <strong style={{ color: transcript.attendance_percentage >= 75 ? 'green' : 'red' }}>
                    {transcript.attendance_percentage}%
                  </strong>
                </div>
              </div>
            </div>

            {/* Academic Record */}
            <div style={{ borderTop:'2px solid #000', paddingTop:'14px', marginBottom:'12px',
              fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>
              Academic Record
            </div>

            {Object.entries(transcript.semesters).length === 0 ? (
              <div style={{ padding:'20px', textAlign:'center', color:'#888', fontStyle:'italic' }}>
                No grades recorded yet.
              </div>
            ) : (
              Object.entries(transcript.semesters).map(([sem, data]) => (
                <div key={sem} style={{ marginBottom:'22px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                    borderBottom:'1.5px solid #000', paddingBottom:'4px', marginBottom:'6px' }}>
                    <span style={{ fontSize:'12px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em' }}>
                      Semester: {sem}
                    </span>
                    <span style={{ fontSize:'11px' }}>
                      GPA: <strong>{data.gpa}</strong> &nbsp;|&nbsp; Credits: <strong>{data.total_credits}</strong>
                    </span>
                  </div>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12.5px' }}>
                    <thead>
                      <tr style={{ background:'#f0f0f0' }}>
                        {['Code','Course Name','Cr. Hrs','Score','Grade'].map(h => (
                          <th key={h} style={{ padding:'6px 10px', textAlign: h === 'Course Name' ? 'left' : 'center',
                            fontSize:'10.5px', textTransform:'uppercase', borderBottom:'1px solid #ccc' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.grades.map((g, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <td style={{ padding:'6px 10px', fontWeight:600, textAlign:'center' }}>{g.class_code || '—'}</td>
                          <td style={{ padding:'6px 10px' }}>{g.class_name || '—'}</td>
                          <td style={{ padding:'6px 10px', textAlign:'center' }}>{g.credit_hours}</td>
                          <td style={{ padding:'6px 10px', textAlign:'center' }}>{g.score != null ? `${g.score}%` : '—'}</td>
                          <td style={{ padding:'6px 10px', textAlign:'center', fontWeight:900, fontSize:'15px',
                            color: gradeColor(g.grade) }}>
                            {g.grade || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}

            {/* Signature Line */}
            <div style={{ marginTop:'36px', borderTop:'1px solid #000', paddingTop:'14px',
              display:'flex', justifyContent:'space-between', fontSize:'11px', flexWrap:'wrap', gap:'16px' }}>
              <div>
                <div style={{ marginBottom:'28px' }}>Registrar's Signature: ______________________</div>
                <div>Date: ______________________</div>
              </div>
              <div style={{ textAlign:'right', color:'#555' }}>
                <div style={{ fontWeight:700 }}>School Administration System</div>
                <div>Official Academic Record</div>
              </div>
            </div>

            <div style={{ marginTop:'14px', borderTop:'1px dashed #aaa', paddingTop:'8px',
              fontSize:'10px', color:'#888', textAlign:'center' }}>
              CONFIDENTIAL — This transcript is only valid with the official stamp and signature of the Registrar.
            </div>
          </div>
        </div>
        </div>
      )}

      {!transcript && !loading && (
        <div className="empty-state" style={{ minHeight:300 }}>
          <p>{user?.role === 'student' ? 'Your transcript will appear here' : 'Select a student to view their transcript'}</p>
        </div>
      )}

      {/* Grade Entry Modal */}
      {showGradeModal && (
        <div className="modal-overlay" onClick={() => setShowGradeModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Enter Grade</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowGradeModal(false)}>✕</button>
            </div>
            <form onSubmit={submitGrade}>
              <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                <div className="form-group">
                  <label className="form-label">Student</label>
                  <select className="form-select" required value={gradeForm.student_id}
                    onChange={e => setGradeForm(f => ({ ...f, student_id: e.target.value }))}>
                    <option value="">Select student</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.student_number} — {s.first_name} {s.last_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Class</label>
                  <select className="form-select" required value={gradeForm.class_id}
                    onChange={e => setGradeForm(f => ({ ...f, class_id: e.target.value }))}>
                    <option value="">Select class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                  </select>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Semester</label>
                    <input className="form-input" placeholder="e.g. 2024-Sem1" required value={gradeForm.semester}
                      onChange={e => setGradeForm(f => ({ ...f, semester: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Grade</label>
                    <select className="form-select" required value={gradeForm.grade}
                      onChange={e => setGradeForm(f => ({ ...f, grade: e.target.value }))}>
                      <option value="">Select</option>
                      {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Score (%)</label>
                    <input className="form-input" type="number" min="0" max="100" placeholder="85.5" value={gradeForm.score}
                      onChange={e => setGradeForm(f => ({ ...f, score: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Comments</label>
                  <textarea className="form-textarea" placeholder="Teacher comments..." value={gradeForm.comments}
                    onChange={e => setGradeForm(f => ({ ...f, comments: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowGradeModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Grade</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}
