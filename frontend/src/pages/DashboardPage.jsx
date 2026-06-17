import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import API from '../api/axios';
import ProtectedLayout from '../components/ProtectedLayout';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import StudentSetupModal from '../components/StudentSetupModal';

const StatCard = ({ label, value, accent, sub, onClick }) => (
  <div
    className="stat-card"
    style={{ '--accent': accent, cursor: onClick ? 'pointer' : 'default' }}
    onClick={onClick}
  >
    <div>
      <div className="stat-value" style={{ fontSize: 'clamp(22px, 5vw, 32px)' }}>
        {value === null ? <span style={{ color: 'var(--color-text-muted)', fontSize: '20px' }}>—</span> : value}
      </div>
      <div className="stat-label" style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginTop: '4px' }}>{label}</div>
      {sub && <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '6px' }}>{sub}</div>}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '12px'
    }}>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '6px' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 700 }}>
          {p.name}: {typeof p.value === 'number' && p.value > 1000
            ? `Le ${p.value.toLocaleString()}`
            : p.value}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [tuition, setTuition] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [programsList, setProgramsList] = useState([]);

  // Filters state
  const [program, setProgram] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch programs dynamically from database
  useEffect(() => {
    API.get('/classes/programs')
      .then(res => setProgramsList(res.data.data || []))
      .catch(() => {});
  }, []);

  const loadData = async (showFullSpinner = true) => {
    if (showFullSpinner) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (program) params.append('program', program);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const results = await Promise.allSettled([
        API.get(`/students/count?${params}`),
        API.get(`/teachers/count?${params}`),
        API.get(`/classes/count?${params}`),
        API.get(`/payments/total?${params}`),
        API.get(`/attendance/rate?${params}`),
        user?.role === 'admin' ? API.get(`/approvals/count?${params}`) : Promise.resolve({ data: { data: { count: 0 } } }),
        API.get(`/dashboard/attendance-trend?${params}`),
        API.get(`/dashboard/tuition-progress?${params}`),
      ]);

      const get = (i, path, fallback) => {
        if (results[i].status === 'fulfilled') {
          const keys = path.split('.');
          let val = results[i].value;
          for (const k of keys) val = val?.[k];
          return val ?? fallback;
        }
        return fallback;
      };

      setStats({
        total_students:       get(0, 'data.data.count', null),
        total_teachers:       get(1, 'data.data.count', null),
        total_classes:        get(2, 'data.data.count', null),
        tuition_collected:    get(3, 'data.data.total', null),
        attendance_rate:      get(4, 'data.data.rate',  null),
        pending_registrations:get(5, 'data.data.count', null),
      });

      setAttendance(get(6, 'data.data', []));
      setTuition(get(7, 'data.data', []));

      if (user?.role === 'admin' || user?.role === 'teacher') {
        try {
          const p = await API.get(`/dashboard/payroll-summary?${params}`);
          setPayroll(p.data.data || []);
        } catch { /* payroll optional */ }
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, program, startDate, endDate]);

  const formatLeones = (v) => `Le ${(v / 1000000).toFixed(1)}M`;

  // Dynamic Attendance Calculations for Widget
  const totalPresent = attendance.reduce((sum, item) => sum + (item.present || 0), 0);
  const totalAbsent = attendance.reduce((sum, item) => sum + (item.absent || 0), 0);
  const totalDays = totalPresent + totalAbsent;
  const avgPresentPct = totalDays > 0 ? parseFloat(((totalPresent / totalDays) * 100).toFixed(1)) : 0;
  const avgAbsentPct = totalDays > 0 ? parseFloat(((totalAbsent / totalDays) * 100).toFixed(1)) : 0;

  // Export functions
  const handleExportCSV = (data, filename, headers) => {
    if (!data || data.length === 0) {
      toast.error('No data available to export');
      return;
    }
    const csvRows = [headers.join(",")];
    for (const row of data) {
      csvRows.push(headers.map(h => {
        let val = row[h] !== undefined && row[h] !== null ? row[h] : '';
        if (typeof val === 'string') val = `"${val.replace(/"/g, '""')}"`;
        return val;
      }).join(","));
    }
    const blob = new Blob([csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exported successfully');
  };

  const handleExportPDF = (title, headers, data, filename) => {
    if (!data || data.length === 0) {
      toast.error('No data available to export');
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`School Administration System — Generated on ${new Date().toLocaleString()}`, 14, 30);
    
    const tableColumn = headers.map(h => h.replace(/_/g, ' ').toUpperCase());
    const tableRows = [];
    
    data.forEach(item => {
      const rowData = headers.map(h => item[h] !== undefined && item[h] !== null ? item[h] : '');
      tableRows.push(rowData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [0, 0, 0] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });
    
    doc.save(filename);
    toast.success('PDF downloaded successfully');
  };

  return (
    <ProtectedLayout title="Dashboard">
      {user?.needs_setup && <StudentSetupModal />}
      
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #111 0%, #000 100%)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontFamily: 'Outfit', fontSize: 'clamp(16px,4vw,22px)', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
            Welcome back, {user?.name?.split(' ')[0]}
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
            {user?.role === 'admin' && 'System overview and administrative controls'}
            {user?.role === 'teacher' && 'Manage your classes, student attendance, and grades'}
            {user?.role === 'student' && 'Track your academic progress and records'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flexShrink: 0 }}>
          {(user?.role === 'admin' || user?.role === 'teacher') && (
            <button
              className="btn btn-primary"
              style={{ backgroundColor: '#ffffff', borderColor: '#ffffff', color: '#000000', fontWeight: 700, fontSize: '13px', padding: '8px 14px' }}
              onClick={() => navigate('/students/register')}
            >
              Register New Student
            </button>
          )}
          {user?.role === 'admin' && (
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/approvals')}
              style={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '13px', padding: '8px 14px' }}
            >
              Approval Queue
            </button>
          )}
        </div>
      </div>

      {/* Interactive Filters row */}
      <div className="card mb-20" style={{ padding: '16px 20px', borderLeft: '4px solid #000000' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Program Filter</label>
            <select className="form-select" value={program} onChange={e => setProgram(e.target.value)}>
              <option value="">All Faculty Programs</option>
              {programsList.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Start Date</label>
            <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>End Date</label>
            <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setProgram(''); setStartDate(''); setEndDate(''); }}>
              Clear
            </button>
            <button className="btn btn-primary" style={{ flex: 1, backgroundColor: '#000000', borderColor: '#000000' }} onClick={loadData}>
              Apply
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="stats-grid mb-20">
            {(user?.role === 'admin') && (
              <>
                <StatCard label="Total Students"    value={stats?.total_students    != null ? stats.total_students.toLocaleString()           : null} accent="#000000" sub="Active enrollments"  onClick={() => navigate('/students')} />
                <StatCard label="Teachers"          value={stats?.total_teachers    != null ? stats.total_teachers.toLocaleString()           : null} accent="#000000" sub="Active staff"        onClick={() => navigate('/teachers')} />
                <StatCard label="Classes"           value={stats?.total_classes     != null ? stats.total_classes.toLocaleString()            : null} accent="#000000" sub="This semester"       onClick={() => navigate('/classes')} />
                <StatCard label="Tuition Collected" value={stats?.tuition_collected != null ? formatLeones(stats.tuition_collected)           : null} accent="#000000" sub="Verified payments"   onClick={() => navigate('/students')} />
                <StatCard label="Attendance Rate"   value={stats?.attendance_rate   != null ? `${stats.attendance_rate}%`                    : null} accent="#000000" sub="Within current scope" onClick={() => navigate('/attendance')} />
                <StatCard label="Pending Approvals" value={stats?.pending_registrations != null ? stats.pending_registrations                : null} accent="#000000" sub="Awaiting review"     onClick={() => navigate('/approvals')} />
              </>
            )}
            {user?.role === 'teacher' && (
              <>
                <StatCard label="Teachers"        value={stats?.total_teachers != null ? stats.total_teachers.toLocaleString() : null} accent="#000000" sub="Active staff"         onClick={() => navigate('/teachers')} />
                <StatCard label="Classes"         value={stats?.total_classes  != null ? stats.total_classes.toLocaleString()  : null} accent="#000000" sub="This semester"        onClick={() => navigate('/classes')} />
                <StatCard label="Attendance Rate" value={stats?.attendance_rate != null ? `${stats.attendance_rate}%`          : null} accent="#000000" sub="Within current scope"  onClick={() => navigate('/attendance')} />
              </>
            )}
            {user?.role === 'student' && (
              <>
                <StatCard label="Classes"         value={stats?.total_classes   != null ? stats.total_classes.toLocaleString() : null} accent="#000000" sub="This semester"        onClick={() => navigate('/classes')} />
                <StatCard label="Attendance Rate" value={stats?.attendance_rate  != null ? `${stats.attendance_rate}%`         : null} accent="#000000" sub="Within current scope"  onClick={() => navigate('/attendance')} />
              </>
            )}
          </div>

          {/* Real-time Attendance Summary Widget */}
          <div className="card mb-28" style={{ borderLeft: '4px solid #000000' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Real-time Attendance Summary</h3>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>Computed live from class attendance sheets</p>
            {totalDays === 0 ? (
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>No attendance records recorded yet in this range.</p>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                  <span>Present Rate: <strong>{avgPresentPct}%</strong> ({totalPresent.toLocaleString()} records)</span>
                  <span>Absent Rate: <strong>{avgAbsentPct}%</strong> ({totalAbsent.toLocaleString()} records)</span>
                </div>
                <div style={{ height: '12px', background: 'var(--color-border)', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${avgPresentPct}%`, background: '#10B981', height: '100%' }} title={`Present: ${avgPresentPct}%`} />
                  <div style={{ width: `${avgAbsentPct}%`, background: '#EF4444', height: '100%' }} title={`Absent: ${avgAbsentPct}%`} />
                </div>
              </div>
            )}
          </div>

          {/* Charts Row 1 */}
          <div className="charts-grid mb-20">
            {/* Attendance Trend */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>Attendance Trend</h3>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Historical trends — Present vs Absent</p>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleExportCSV(attendance, 'attendance-trend.csv', ['date', 'present', 'absent'])}>CSV</button>
                  <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleExportPDF('Attendance Trend Report', ['date', 'present', 'absent'], attendance, 'attendance-trend.pdf')}>PDF</button>
                </div>
              </div>
              {attendance.length === 0 ? (
                <div className="empty-state" style={{ minHeight: '220px' }}><p>No attendance data in range</p></div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={attendance} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                    <defs>
                      <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="#52525B" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#52525B" tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="present" name="Present" stroke="#10B981" fill="url(#presentGrad)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="absent"  name="Absent"  stroke="#EF4444" fill="url(#absentGrad)"  strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Tuition Progress - Admin Only */}
            {user?.role === 'admin' && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>Tuition Collection</h3>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Monthly collected vs expected (in Leones)</p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleExportCSV(tuition, 'tuition-progress.csv', ['month', 'collected', 'expected'])}>CSV</button>
                    <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleExportPDF('Tuition Collection Report', ['month', 'collected', 'expected'], tuition, 'tuition-progress.pdf')}>PDF</button>
                  </div>
                </div>
                {tuition.length === 0 ? (
                  <div className="empty-state" style={{ minHeight: '220px' }}><p>No tuition data in range</p></div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={tuition} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" stroke="#52525B" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#52525B" tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1e6).toFixed(0)}M`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="expected"  name="Expected"  fill="rgba(245,158,11,0.2)" radius={[4,4,0,0]} />
                      <Bar dataKey="collected" name="Collected" fill="#F59E0B" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}
          </div>

          {/* Payroll Chart (admin and teacher) */}
          {(user?.role === 'admin' || user?.role === 'teacher') && (
            <div className="card mb-20">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>Monthly Payroll Summary</h3>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Total net pay disbursed to teachers (Leones)</p>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleExportCSV(payroll, 'payroll-summary.csv', ['month', 'total_net_pay', 'total_salary', 'total_allowances', 'total_deductions'])}>CSV</button>
                  <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleExportPDF('Payroll Summary Report', ['month', 'total_net_pay', 'total_salary', 'total_allowances', 'total_deductions'], payroll, 'payroll-summary.pdf')}>PDF</button>
                </div>
              </div>
              {payroll.length === 0 ? (
                <div className="empty-state" style={{ minHeight: '200px' }}><p>No payroll data in range</p></div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={payroll} margin={{ top: 5, right: 20, bottom: 0, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" stroke="#52525B" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#52525B" tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1e6).toFixed(1)}M`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="total_net_pay" name="Net Pay" stroke="#8B5CF6" strokeWidth={2.5} dot={{ fill: '#8B5CF6', r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* Quick Actions Row */}
          <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            {user?.role === 'admin' && [
              { href: '/approvals', label: 'Approval Queue', color: '#000000' },
              { href: '/students/register', label: 'New Student', color: '#000000' },
              { href: '/payroll', label: 'Payroll Management', color: '#000000' },
              { href: '/audit', label: 'Audit Log', color: '#000000' },
            ].map(q => (
              <a key={q.href} onClick={() => navigate(q.href)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', padding: '16px',
                transition: 'all 0.15s', cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = q.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
              >
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{q.label}</span>
              </a>
            ))}

            {user?.role === 'student' && [
              { href: '/reports', label: 'My Report Card & Transcript', color: '#000000' },
              { href: '/attendance', label: 'View My Attendance', color: '#000000' },
            ].map(q => (
              <a key={q.href} onClick={() => navigate(q.href)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', padding: '16px',
                transition: 'all 0.15s', cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = q.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
              >
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{q.label}</span>
              </a>
            ))}
          </div>
        </>
      )}
    </ProtectedLayout>
  );
}
