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
import { programLabel } from '../utils/programs';

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
  const [recentActivity, setRecentActivity] = useState([]);
  const [aiOverview, setAiOverview] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState('');
  const [aiReportLoading, setAiReportLoading] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('daily');

  // Filters state
  const [program, setProgram] = useState('');
  const [faculty, setFaculty] = useState('');
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
      if (faculty) params.append('faculty', faculty);
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

      if (user?.role === 'admin' || user?.role === 'superadmin') {
        try {
          const p = await API.get(`/dashboard/payroll-summary?${params}`);
          setPayroll(p.data.data || []);
        } catch { /* payroll optional */ }
      }

      // Fetch recent activity log
      try {
        const actRes = await API.get('/audit/recent');
        setRecentActivity(actRes.data.data || []);
      } catch { /* silent */ }

    } catch (error) {
      console.error(error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch AI auto-overview after stats load
  const fetchAiOverview = async (statsData) => {
    if (!statsData) return;
    setAiLoading(true);
    try {
      const contextData = {
        total_students: statsData.total_students,
        total_teachers: statsData.total_teachers,
        total_classes: statsData.total_classes,
        attendance_rate: statsData.attendance_rate,
        tuition_collected: statsData.tuition_collected,
        pending_approvals: statsData.pending_registrations,
      };
      let promptStr = `Generate a brief 3-4 sentence executive dashboard summary for the school administrator. Be direct, professional and data-driven. Highlight any concerns if attendance is below 80% or pending approvals are high.`;
      if (user?.role === 'teacher') {
        promptStr = `Generate a brief 2-3 sentence dashboard summary for a teacher. Highlight their class count, student count, and attendance rates. Be encouraging and professional.`;
      } else if (user?.role === 'student') {
        promptStr = `Generate a brief 2-3 sentence dashboard summary for a student. Highlight their attendance rate and any tuition payments made. Be encouraging.`;
      }

      const { data } = await API.post('/ai/query', {
        query: promptStr,
        contextType: user?.role === 'superadmin' ? 'global platform' : (user?.role === 'teacher' ? 'teacher dashboard' : (user?.role === 'student' ? 'student dashboard' : 'school')),
        contextData,
      });
      if (data.success) {
        setAiOverview(data.data.answer);
      } else {
        setAiOverview(`⚠️ ${data.message}`);
      }
    } catch { /* silent — AI overview is optional */ }
    setAiLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user, program, faculty, startDate, endDate]);

  // Auto-load AI overview if VITE_AI_AUTO_LOAD=true (paid tier)
  // Set to false by default to preserve free tier quota (20 req/day)
  const aiAutoLoad = import.meta.env.VITE_AI_AUTO_LOAD === 'true';

  useEffect(() => {
    if (aiAutoLoad && stats && user?.role) {
      fetchAiOverview(stats);
    }
  }, [stats]);

  // Auto-fetch AI intelligence report on mount
  const fetchAiReport = async (period = 'daily') => {
    setAiReportLoading(true);
    try {
      const { data } = await API.get(`/ai/report?period=${period}`);
      if (data.success) {
        setAiReport(data.data.report);
      } else {
        setAiReport(`Unable to generate report: ${data.message}`);
      }
    } catch { setAiReport(''); }
    setAiReportLoading(false);
  };

  // Auto-load AI report if VITE_AI_AUTO_LOAD=true (paid tier)
  useEffect(() => {
    if (aiAutoLoad && user?.role) fetchAiReport(reportPeriod);
  }, [user, reportPeriod]);

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
            {user?.role === 'superadmin' && 'Platform-wide oversight — all schools, tenants and system metrics'}
            {user?.role === 'teacher' && 'Manage your classes, student attendance, and grades'}
            {user?.role === 'student' && 'Track your academic progress and records'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flexShrink: 0, marginTop: '8px' }}>
          {user?.role === 'admin' && (
            <button
              className="btn btn-primary"
              style={{ backgroundColor: '#ffffff', borderColor: '#ffffff', color: '#000000', fontWeight: 700, fontSize: '13px', padding: '8px 14px' }}
              onClick={() => navigate('/students/register')}
            >
              Register New Student
            </button>
          )}
          {user?.role === 'superadmin' && (
            <button
              className="btn btn-primary"
              style={{ backgroundColor: '#ffffff', borderColor: '#ffffff', color: '#000000', fontWeight: 700, fontSize: '13px', padding: '8px 14px' }}
              onClick={() => navigate('/platform')}
            >
              Platform Overview
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

      {/* ── AI Dashboard Overview (auto-generated, all roles) ── */}
      {user && (
        <div className="card mb-20" style={{ borderLeft: '4px solid var(--color-gold)', background: 'var(--color-bg-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>AI Dashboard Overview</h3>
                <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: 0 }}>Auto-generated by Gemini · Updated on load</p>
              </div>
            </div>
            <div style={{ background: 'var(--color-gold)', color: '#000', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 800, letterSpacing: '0.5px' }}>
              GEMINI POWERED
            </div>
          </div>
          {aiLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text-muted)', fontSize: '13px', padding: '8px 0' }}>
              <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              Gemini is analyzing your dashboard data…
            </div>
          ) : aiOverview ? (
            <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--color-text-secondary)', margin: 0 }}>
              {aiOverview}
            </p>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
              Click <strong>Generate Overview</strong> to get an AI summary of your current dashboard data.
            </p>
          )}
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '12px', padding: '5px 14px' }}
              onClick={() => fetchAiOverview(stats)}
              disabled={aiLoading || !stats}
            >
              ✦ {aiOverview ? '↻ Refresh' : 'Generate Overview'}
            </button>
          </div>
        </div>
      )}

      {/* ── AI Intelligence Report (auto-generated daily/weekly) ── */}
      {(user?.role === 'admin' || user?.role === 'superadmin') && (
        <div className="card mb-20" style={{ borderLeft: '4px solid #7C3AED', background: 'var(--color-bg-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>AI Intelligence Report</h3>
              <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '2px 0 0 0' }}>
                Auto-analysed by Gemini · No prompt needed
              </p>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                {['daily', 'weekly'].map(p => (
                  <button
                    key={p}
                    onClick={() => setReportPeriod(p)}
                    style={{
                      padding: '4px 12px', fontSize: '11px', fontWeight: 600,
                      background: reportPeriod === p ? '#7C3AED' : 'transparent',
                      color: reportPeriod === p ? '#fff' : 'var(--color-text-muted)',
                      border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      textTransform: 'capitalize',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11px', padding: '4px 10px' }}
                onClick={() => fetchAiReport(reportPeriod)}
                disabled={aiReportLoading}
              >
                ↻
              </button>
            </div>
          </div>
          {aiReportLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text-muted)', fontSize: '13px', padding: '8px 0' }}>
              <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              Gemini is reading your {reportPeriod} activity data...
            </div>
          ) : aiReport ? (
            <p style={{ fontSize: '14px', lineHeight: 1.75, color: 'var(--color-text-secondary)', margin: 0 }}>
              {aiReport}
            </p>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
              Report unavailable. Ensure the Gemini API key is configured in production.
            </p>
          )}
        </div>
      )}

      {/* Interactive Filters row (admin only) */}
      {(user?.role === 'admin') && (
      <div className="card mb-20" style={{ padding: '16px 20px', borderLeft: '4px solid #000000' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Program Filter</label>
            <select className="form-select" value={program} onChange={e => setProgram(e.target.value)}>
              <option value="">All Faculty Programs</option>
              {programsList.map(p => <option key={p} value={p}>{programLabel(p)}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Faculty</label>
            <select className="form-select" value={faculty} onChange={e => setFaculty(e.target.value)}>
              <option value="">All Faculties</option>
              <option value="IT">Information Technology</option>
              <option value="Business">Business</option>
              <option value="Engineering">Engineering</option>
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
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setProgram(''); setFaculty(''); setStartDate(''); setEndDate(''); }}>
              Clear
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={loadData}>
              Apply
            </button>
          </div>
        </div>
      </div>
      )}

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
            {(user?.role === 'superadmin') && (
              <>
                <StatCard label="Total Schools"   value="1" accent="#000000" sub="Active Tenants" />
                <StatCard label="Global Students" value={stats?.total_students != null ? stats.total_students.toLocaleString() : null} accent="#000000" sub="Across all schools" />
                <StatCard label="Global Teachers" value={stats?.total_teachers != null ? stats.total_teachers.toLocaleString() : null} accent="#000000" sub="Across all schools" />
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
                <StatCard label="Enrolled Classes"  value={stats?.total_classes   != null ? stats.total_classes.toLocaleString() : null} accent="#000000" sub="Classes available this semester"  onClick={() => navigate('/classes')} />
                <StatCard label="My Attendance Rate" value={stats?.attendance_rate  != null ? `${stats.attendance_rate}%`         : null} accent="#000000" sub="Personal attendance record"        onClick={() => navigate('/attendance')} />
                <StatCard label="My Transcript"      value="View" accent="#000000" sub="Grades & GPA"        onClick={() => navigate('/reports')} />
              </>
            )}
          </div>

          {/* Real-time Attendance Summary Widget */}
          {user?.role !== 'superadmin' && (
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
          )}

          {/* Charts Row 1 */}
          {user?.role !== 'superadmin' && (
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
          )}

          {/* Payroll Chart (admin only) */}
          {(user?.role === 'admin') && (
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


          {/* ── Activity Log Widget ── */}
          {(user?.role === 'admin' || user?.role === 'superadmin') && (
          <div className="card mb-20">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Recent Activity</h3>
                <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '3px 0 0 0' }}>
                  {user?.role === 'admin' ? 'Latest actions across your school' : 'Your recent account activity'}
                </p>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '12px', padding: '5px 14px' }}
                onClick={() => navigate('/audit')}
              >
                View All →
              </button>
            </div>
            {recentActivity.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                No activity recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {recentActivity.map((log, i) => {
                  const timeAgo = (ts) => {
                    const diff = Date.now() - new Date(ts).getTime();
                    const m = Math.floor(diff / 60000);
                    if (m < 1) return 'Just now';
                    if (m < 60) return `${m}m ago`;
                    const h = Math.floor(m / 60);
                    if (h < 24) return `${h}h ago`;
                    return `${Math.floor(h / 24)}d ago`;
                  };
                  const actionColor = {
                    login: '#10B981', logout: '#6B7280',
                    register: '#3B82F6', update: '#F59E0B',
                    delete: '#EF4444', approve: '#10B981', reject: '#EF4444',
                  }[log.action?.toLowerCase()] || 'var(--color-gold)';

                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 12px', borderRadius: 'var(--radius-md)',
                      background: i % 2 === 0 ? 'transparent' : 'var(--color-bg-hover)',
                    }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: actionColor, flexShrink: 0,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {log.user_name}
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginLeft: 6 }}>
                          {log.action?.replace(/_/g, ' ')}
                          {log.entity_type && ` · ${log.entity_type}`}
                        </span>
                        {log.notes && (
                          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block', marginTop: 1 }}>
                            {log.notes}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        {timeAgo(log.timestamp)}
                      </span>
                    </div>
                  );
                })}
              </div>
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

            {user?.role === 'superadmin' && [
              { href: '/superadmin/schools', label: 'Manage Schools', color: '#7C3AED' },
              { href: '/audit', label: 'Platform Audit Log', color: '#7C3AED' },
              { href: '/ai', label: 'AI Assistant', color: '#7C3AED' },
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

            {user?.role === 'teacher' && [
              { href: '/attendance', label: 'Mark Attendance', color: '#000000' },
              { href: '/classes', label: 'My Classes', color: '#000000' },
              { href: '/ai', label: 'AI Assistant', color: '#000000' },
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
              { href: '/ai', label: 'AI Assistant', color: '#000000' },
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
