import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/axios';
import ProtectedLayout from '../components/ProtectedLayout';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const gradeColor = (g) => {
  if (!g) return 'var(--color-text-muted)';
  if (g.startsWith('A')) return 'var(--color-success)';
  if (g.startsWith('B')) return 'var(--color-info)';
  if (g.startsWith('C')) return 'var(--color-warning)';
  return 'var(--color-danger)';
};

export default function ReportsPage() {
  const { user } = useAuth();
  const { studentId: paramId } = useParams();
  const [transcriptId, setTranscriptId] = useState(paramId || (user?.role === 'student' ? user.id : ''));
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradeForm, setGradeForm] = useState({ student_id:'', class_id:'', semester:'', grade:'', score:'', comments:'' });
  const [classes, setClasses] = useState([]);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (user?.role !== 'student') {
      API.get('/students?limit=100&status=active').then(r => setStudents(r.data.data || [])).catch(() => {});
      API.get('/classes').then(r => setClasses(r.data.data || [])).catch(() => {});
    }
    if (transcriptId) loadTranscript(transcriptId);
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

  // Export CSV
  const exportCSV = () => {
    if (!transcript) return;
    const { student, semesters } = transcript;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Student Name,${student.first_name} ${student.last_name}\n`;
    csvContent += `Student Number,${student.student_number}\n`;
    csvContent += `Program,${student.program || 'N/A'}\n`;
    csvContent += `Cumulative GPA,${transcript.cumulative_gpa}\n`;
    csvContent += `Total Credits,${transcript.total_credits}\n\n`;
    csvContent += "Semester,Class Code,Class Name,Credits,Score,Grade,Comments\n";

    Object.entries(semesters).forEach(([sem, data]) => {
      data.grades.forEach(g => {
        const row = [
          sem,
          g.class_code,
          `"${g.class_name.replace(/"/g, '""')}"`,
          g.credit_hours,
          g.score ? `${g.score}%` : '—',
          g.grade || '—',
          `"${(g.comments || '').replace(/"/g, '""')}"`
        ].join(",");
        csvContent += row + "\n";
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Transcript_${student.student_number}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF (Print View)
  const exportPDF = () => {
    if (!transcript) return;
    const { student, semesters } = transcript;
    const printWindow = window.open('', '_blank');
    
    let semestersHtml = '';
    Object.entries(semesters).forEach(([sem, data]) => {
      let gradesRows = '';
      data.grades.forEach(g => {
        gradesRows += `
          <tr>
            <td>${g.class_code}</td>
            <td>${g.class_name}</td>
            <td>${g.credit_hours}</td>
            <td>${g.score ? g.score + '%' : '—'}</td>
            <td><strong>${g.grade || '—'}</strong></td>
          </tr>
        `;
      });

      semestersHtml += `
        <div class="semester-section">
          <h3>Semester: ${sem} (GPA: ${data.gpa}, Credits: ${data.total_credits})</h3>
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Course Name</th>
                <th>Credits</th>
                <th>Score</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              ${gradesRows}
            </tbody>
          </table>
        </div>
      `;
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>Academic Transcript - ${student.student_number}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #000; padding: 40px; }
            h1 { font-size: 24px; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .meta-item { font-size: 14px; margin-bottom: 5px; }
            .gpa-card { background: #f4f4f5; padding: 15px; border: 1px solid #e4e4e7; border-radius: 4px; text-align: center; }
            .gpa-val { font-size: 28px; font-weight: 800; }
            .semester-section { margin-bottom: 30px; }
            h3 { font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #e4e4e7; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { text-align: left; padding: 8px; font-size: 13px; border-bottom: 1px solid #e4e4e7; }
            th { background: #f4f4f5; font-weight: bold; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h1>Official Academic Transcript</h1>
          <div class="meta-grid">
            <div>
              <div class="meta-item"><strong>Student Name:</strong> ${student.first_name} ${student.last_name}</div>
              <div class="meta-item"><strong>Student ID:</strong> ${student.student_number}</div>
              <div class="meta-item"><strong>Program:</strong> ${student.program || 'N/A'}</div>
              <div class="meta-item"><strong>Nationality:</strong> ${student.nationality || 'Sierra Leonean'}</div>
            </div>
            <div class="gpa-card">
              <div class="gpa-val">${transcript.cumulative_gpa}</div>
              <div style="font-size: 11px; text-transform: uppercase; color: #71717a;">Cumulative GPA</div>
              <div style="font-size: 13px; font-weight: bold; margin-top: 5px;">Total Credits: ${transcript.total_credits}</div>
            </div>
          </div>
          ${semestersHtml}
          <div style="margin-top: 50px; border-top: 1px solid #000; padding-top: 10px; font-size: 11px; text-align: center; color: #71717a;">
            School Administration System · Verified Academic Record
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); }
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const GRADES = ['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','F'];

  return (
    <ProtectedLayout title="Academic Reports">
      <div className="page-header">
        <div>
          <h1>Academic Reports & Transcripts</h1>
          <p>GPA calculation, semester grades, and cumulative records</p>
        </div>
        <div style={{ display:'flex', gap:'10px' }}>
          {(user?.role === 'admin' || user?.role === 'teacher') && (
            <button className="btn btn-primary" onClick={() => setShowGradeModal(true)}>Enter Grade</button>
          )}
          {transcript && (
            <>
              <button className="btn btn-secondary" onClick={exportCSV}>Export CSV</button>
              <button className="btn btn-secondary" onClick={exportPDF}>Export PDF</button>
            </>
          )}
          {user?.role === 'student' && (
            <button className="btn btn-secondary" onClick={requestTranscript} disabled={requesting}>
              {requesting ? 'Requesting...' : 'Request Official Transcript'}
            </button>
          )}
        </div>
      </div>

      {/* Student Selector (admin/teacher) */}
      {user?.role !== 'student' && (
        <div className="card mb-20" style={{ padding:'16px 20px' }}>
          <div style={{ display:'flex', gap:'12px', alignItems:'end' }}>
            <div className="form-group" style={{ flex:1 }}>
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

      {/* Transcript */}
      {loading && <div className="loading-center"><div className="spinner" /></div>}

      {transcript && !loading && (
        <>
          {/* Student Info */}
          <div className="card mb-20">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'16px' }}>
              <div>
                <h2 style={{ fontSize:'22px', fontWeight:800 }}>{transcript.student.first_name} {transcript.student.last_name}</h2>
                <p style={{ color:'var(--color-text-secondary)', fontSize:'14px', marginTop:'4px' }}>
                  {transcript.student.student_number} · {transcript.student.program || 'N/A'} · Year {transcript.student.year_of_study || '—'}
                </p>
              </div>
              <div style={{ display:'flex', gap:'20px', textAlign:'right' }}>
                <div>
                  <div style={{ fontSize:'32px', fontWeight:900, fontFamily:'Outfit', color: parseFloat(transcript.cumulative_gpa) >= 3.0 ? 'var(--color-success)' : parseFloat(transcript.cumulative_gpa) >= 2.0 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
                    {transcript.cumulative_gpa}
                  </div>
                  <div style={{ fontSize:'11px', color:'var(--color-text-muted)', textTransform:'uppercase', letterSpacing:'0.07em' }}>Cumulative GPA</div>
                </div>
                <div>
                  <div style={{ fontSize:'32px', fontWeight:900, fontFamily:'Outfit', color:'var(--color-info)' }}>
                    {transcript.total_credits}
                  </div>
                  <div style={{ fontSize:'11px', color:'var(--color-text-muted)', textTransform:'uppercase', letterSpacing:'0.07em' }}>Total Credits</div>
                </div>
                <div>
                  <div style={{ fontSize:'32px', fontWeight:900, fontFamily:'Outfit', color: transcript.attendance_percentage >= 75 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {transcript.attendance_percentage}%
                  </div>
                  <div style={{ fontSize:'11px', color:'var(--color-text-muted)', textTransform:'uppercase', letterSpacing:'0.07em' }}>Attendance</div>
                </div>
              </div>
            </div>
          </div>

          {/* Semester Breakdown */}
          {Object.entries(transcript.semesters).length === 0 ? (
            <div className="card">
              <div className="empty-state"><p>No grades recorded yet</p></div>
            </div>
          ) : (
            Object.entries(transcript.semesters).map(([sem, data]) => (
              <div className="card mb-20" key={sem}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
                  <h3 style={{ fontSize:'16px', fontWeight:700 }}>Semester: {sem}</h3>
                  <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
                    <span style={{ fontSize:'13px', color:'var(--color-text-muted)' }}>Credits: {data.total_credits}</span>
                    <span style={{ fontSize:'16px', fontWeight:800, color:'var(--color-gold)' }}>GPA: {data.gpa}</span>
                  </div>
                </div>
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead><tr><th>Class</th><th>Code</th><th>Teacher</th><th>Credits</th><th>Score</th><th>Grade</th><th>Comments</th></tr></thead>
                    <tbody>
                      {data.grades.map(g => (
                        <tr key={g.id}>
                          <td style={{ color:'#fff', fontWeight:600 }}>{g.class_name}</td>
                          <td><code style={{ fontSize:'11px', color:'var(--color-text-muted)' }}>{g.class_code}</code></td>
                          <td style={{ fontSize:'13px' }}>{g.teacher_first} {g.teacher_last}</td>
                          <td>{g.credit_hours}</td>
                          <td>{g.score ? `${g.score}%` : '—'}</td>
                          <td>
                            <span style={{ fontSize:'20px', fontWeight:900, fontFamily:'Outfit', color: gradeColor(g.grade) }}>
                              {g.grade || '—'}
                            </span>
                          </td>
                          <td style={{ fontSize:'12px', color:'var(--color-text-muted)', maxWidth:'200px' }}>{g.comments || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {!transcript && !loading && (
        <div className="empty-state" style={{ minHeight: 300 }}>
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
