import React, { useEffect, useState, useCallback } from 'react';
import API from '../api/axios';
import ProtectedLayout from '../components/ProtectedLayout';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_COLORS = { present:'success', absent:'danger', late:'warning', excused:'info', not_recorded:'neutral' };

export default function AttendancePage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [programsList, setProgramsList] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [roster, setRoster] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Student view
  const [myAttendance, setMyAttendance] = useState([]);

  // Fetch programs dynamically from database
  useEffect(() => {
    API.get('/classes/programs')
      .then(res => setProgramsList(res.data.data || []))
      .catch(() => setProgramsList(['BIT', 'BBIT', 'BSEM', 'BICT', 'DAT']));
  }, []);

  useEffect(() => {
    if (user?.role === 'student') {
      API.get(`/attendance/report/student/${user.id}`)
        .then(r => setMyAttendance(r.data.data || []))
        .catch(() => {});
    } else {
      const teacherId = user?.role === 'teacher' ? `?teacher_id=${user.id}` : '';
      API.get(`/classes${teacherId}`)
        .then(r => {
          const list = r.data.data || [];
          setClasses(list);
          setFilteredClasses(list);
        })
        .catch(() => {});
    }
  }, [user]);

  // Filter classes dropdown by program
  useEffect(() => {
    if (selectedProgram) {
      setFilteredClasses(classes.filter(c => c.program === selectedProgram));
      setSelectedClass(''); // reset selection
    } else {
      setFilteredClasses(classes);
    }
  }, [selectedProgram, classes]);

  const loadRoster = useCallback(async () => {
    if (!selectedClass || !selectedDate) return;
    setLoadingRoster(true);
    try {
      const { data } = await API.get(`/attendance/class/${selectedClass}/date/${selectedDate}`);
      setRoster(data.data.map(s => ({
        ...s,
        status: s.status === 'not_recorded' ? 'absent' : s.status,
      })));
    } catch {
      toast.error('Failed to load class roster');
    } finally {
      setLoadingRoster(false);
    }
  }, [selectedClass, selectedDate]);

  useEffect(() => { loadRoster(); }, [loadRoster]);

  const toggleStatus = (studentId) => {
    setRoster(r => r.map(s => s.student_id === studentId
      ? { ...s, status: s.status === 'present' ? 'absent' : 'present' }
      : s
    ));
  };

  const setAllPresent = () => setRoster(r => r.map(s => ({ ...s, status: 'present' })));
  const setAllAbsent  = () => setRoster(r => r.map(s => ({ ...s, status: 'absent' })));

  const submitAttendance = async () => {
    if (!selectedClass || !selectedDate || roster.length === 0) return;
    setSubmitting(true);
    try {
      const records = roster.map(s => ({ student_id: s.student_id, status: s.status }));
      await API.post('/attendance/submit', { class_id: selectedClass, date: selectedDate, records });
      toast.success(`Attendance submitted for ${records.length} students`);
      loadRoster();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Export functions
  const handleExportCSV = () => {
    if (roster.length === 0) {
      toast.error('No roster loaded to export');
      return;
    }
    const headers = ['student_number', 'student_name', 'status'];
    const csvRows = [headers.join(",")];
    for (const row of roster) {
      const studentName = `"${row.last_name}, ${row.first_name}"`;
      csvRows.push([row.student_number, studentName, row.status].join(","));
    }
    const blob = new Blob([csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const selectedClassName = classes.find(c => c.id === selectedClass)?.class_name || 'class';
    link.setAttribute('download', `attendance-${selectedClassName.replace(/\s+/g, '-').toLowerCase()}-${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exported successfully');
  };

  const handleExportPDF = () => {
    if (roster.length === 0) {
      toast.error('No roster loaded to export');
      return;
    }
    const selectedClassObj = classes.find(c => c.id === selectedClass);
    const className = selectedClassObj?.class_name || 'Class';
    const classCode = selectedClassObj?.class_code || 'Code';

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Attendance Sheet - ${className}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #111; background: #fff; }
            h1 { font-size: 22px; margin-bottom: 2px; color: #000; font-weight: 800; text-transform: uppercase; }
            p { font-size: 13px; color: #555; margin-bottom: 25px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 10px 12px; text-align: left; font-size: 13px; }
            th { background-color: #000; color: #fff; text-transform: uppercase; font-weight: 700; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .badge { padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; text-transform: uppercase; }
            .present { background-color: #d1fae5; color: #065f46; }
            .absent { background-color: #fee2e2; color: #991b1b; }
            .footer { margin-top: 40px; font-size: 11px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 15px; }
          </style>
        </head>
        <body>
          <h1>Attendance Sheet</h1>
          <p>Class: <strong>${className} (${classCode})</strong> | Date: <strong>${selectedDate}</strong></p>
          <table>
            <thead>
              <tr>
                <th>Student Number</th>
                <th>Student Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${roster.map(row => `
                <tr>
                  <td><code>${row.student_number}</code></td>
                  <td>${row.last_name}, ${row.first_name}</td>
                  <td>
                    <span class="badge ${row.status === 'present' ? 'present' : 'absent'}">
                      ${row.status}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            CONFIDENTIAL — School Administration System. Sierra Leone ICT Law & GDPR Compliant.
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    toast.success('PDF print window opened');
  };

  const presentCount = roster.filter(s => s.status === 'present').length;
  const absentCount  = roster.filter(s => s.status === 'absent').length;

  if (user?.role === 'student') {
    return (
      <ProtectedLayout title="My Attendance">
        <div className="page-header">
          <div><h1>My Attendance Report</h1><p>Your attendance by class</p></div>
        </div>
        <div className="card" style={{ padding:0 }}>
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Class</th><th>Total Days</th><th>Present</th><th>Absent</th><th>Rate</th></tr></thead>
              <tbody>
                {myAttendance.length === 0 ? (
                  <tr><td colSpan={5}><div className="empty-state"><p>No attendance records yet</p></div></td></tr>
                ) : myAttendance.map((a, i) => (
                  <tr key={i}>
                    <td style={{ color:'#fff', fontWeight:600 }}>{a.class_name}</td>
                    <td>{a.total_days}</td>
                    <td style={{ color:'var(--color-success)' }}>{a.present_days}</td>
                    <td style={{ color:'var(--color-danger)' }}>{a.absent_days}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <div style={{ flex:1, height:6, background:'var(--color-border)', borderRadius:3, overflow:'hidden' }}>
                          <div style={{ width:`${a.attendance_pct}%`, height:'100%', background: parseFloat(a.attendance_pct) >= 75 ? 'var(--color-success)' : 'var(--color-danger)', borderRadius:3 }} />
                        </div>
                        <span style={{ fontSize:'12px', fontWeight:700, color: parseFloat(a.attendance_pct) >= 75 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {a.attendance_pct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout title="Attendance" allowedRoles={['admin','teacher']}>
      <div className="page-header">
        <div><h1>Attendance Management</h1><p>Record daily class attendance</p></div>
      </div>

      {/* Selectors */}
      <div className="card mb-20" style={{ padding:'20px', borderLeft: '4px solid #000000' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'16px', alignItems:'end' }}>
          <div className="form-group" style={{ marginBottom:0 }}>
            <label className="form-label">Filter Program</label>
            <select className="form-select" value={selectedProgram} onChange={e => setSelectedProgram(e.target.value)}>
              <option value="">All Faculty Programs</option>
              {programsList.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom:0 }}>
            <label className="form-label">Select Class</label>
            <select className="form-select" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              <option value="">-- Choose a class --</option>
              {filteredClasses.map(c => (
                <option key={c.id} value={c.id}>{c.class_name} ({c.class_code})</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom:0 }}>
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Roster */}
      {selectedClass && (
        <div className="card" style={{ padding:0 }}>
          {/* Stats Bar */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid var(--color-border)', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display:'flex', gap:'20px', flexWrap: 'wrap' }}>
              <span style={{ fontSize:'13px' }}>
                Total: <strong style={{ color:'#fff' }}>{roster.length}</strong>
              </span>
              <span style={{ fontSize:'13px', color:'var(--color-success)' }}>
                Present: <strong>{presentCount}</strong>
              </span>
              <span style={{ fontSize:'13px', color:'var(--color-danger)' }}>
                Absent: <strong>{absentCount}</strong>
              </span>
              {roster.length > 0 && (
                <span style={{ fontSize:'13px', color:'var(--color-gold)' }}>
                  Rate: <strong>{((presentCount / roster.length) * 100).toFixed(0)}%</strong>
                </span>
              )}
            </div>
            <div style={{ display:'flex', gap:'8px', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>Export CSV</button>
              <button className="btn btn-secondary btn-sm" onClick={handleExportPDF}>Export PDF</button>
              <button className="btn btn-success btn-sm" onClick={setAllPresent}>All Present</button>
              <button className="btn btn-danger btn-sm"  onClick={setAllAbsent}>All Absent</button>
              <button className="btn btn-primary btn-sm" style={{ backgroundColor: '#000000', borderColor: '#000000' }} onClick={submitAttendance} disabled={submitting || roster.length === 0}>
                {submitting ? 'Saving...' : 'Submit Attendance'}
              </button>
            </div>
          </div>

          {loadingRoster ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : roster.length === 0 ? (
            <div className="empty-state">
              <p>No students enrolled in this class</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>#</th>
                  <th>Student Number</th>
                  <th>Name</th>
                  <th style={{ textAlign:'center', width: '150px' }}>Present Checkbox</th>
                  <th>Status Badge</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((s, i) => (
                  <tr key={s.student_id} style={{ cursor:'pointer' }} onClick={() => toggleStatus(s.student_id)}>
                    <td style={{ color:'var(--color-text-muted)' }}>{i + 1}</td>
                    <td><code style={{ fontSize:'12px', color:'var(--color-gold)' }}>{s.student_number}</code></td>
                    <td style={{ color:'#fff', fontWeight:600 }}>{s.last_name}, {s.first_name}</td>
                    <td style={{ textAlign:'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          className="attendance-checkbox"
                          checked={s.status === 'present'}
                          onChange={() => toggleStatus(s.student_id)}
                          onClick={e => e.stopPropagation()}
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#000000' }}
                        />
                        <span style={{ fontSize: '12px', color: s.status === 'present' ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                          {s.status === 'present' ? 'Present' : 'Absent'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${STATUS_COLORS[s.status] || 'neutral'}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </ProtectedLayout>
  );
}
