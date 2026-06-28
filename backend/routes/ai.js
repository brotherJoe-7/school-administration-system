const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// GET /api/ai/suggestions
router.get('/suggestions', authenticate, tenantMiddleware, async (req, res) => {
  try {
    const suggestions = [
      { id: 1, type: 'alert', message: 'Attendance is below 70% in Computer Science Year 2. Send reminder?' },
      { id: 2, type: 'info', message: 'Tuition collection is 15% higher this month compared to last month.' },
      { id: 3, type: 'action', message: '3 pending payroll approvals require your attention.' }
    ];
    res.json({ success: true, data: suggestions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch AI suggestions' });
  }
});

// POST /api/ai/query - Natural language queries via Gemini
router.post('/query', authenticate, async (req, res) => {
  const { query, contextData, contextType } = req.body;
  if (!query) return res.status(400).json({ success: false, message: 'Query is required' });

  const role = req.user?.role || 'admin';
  const roleLabel = {
    superadmin: 'Super Administrator (platform-wide access)',
    admin: 'School Administrator',
    teacher: 'Teacher',
    student: 'Student',
    parent: 'Parent',
  }[role] || 'Administrator';

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      // Mock fallback if API key is not yet set
      let answer = `I've analyzed the ${contextType || 'school'} data. Everything is operating normally. (Add GEMINI_API_KEY to backend/.env for real responses)`;
      
      if (contextType === 'global platform') {
        if (query.toLowerCase().includes('revenue') || query.toLowerCase().includes('mrr')) {
          answer = "Looking at the global platform data, current MRR is $12,450. We've seen a 12% growth from last month. (Mock response without API key)";
        } else if (query.toLowerCase().includes('schools') || query.toLowerCase().includes('tenant')) {
          answer = "You currently have active tenants deployed. All isolated databases are fully synced and online. No anomalies detected. (Mock response without API key)";
        }
      } else {
        if (query.toLowerCase().includes('attendance')) {
          answer = "Looking at your school's attendance trends, there is a slight dip in Year 2 classes. 12 students have missed more than 3 classes this week. (Mock response without API key)";
        } else if (query.toLowerCase().includes('payroll')) {
          answer = "Your November payroll is ready for review. Total disbursement is $48,200 across 34 staff members in your institution. (Mock response without API key)";
        }
      }
      return res.json({ success: true, data: { answer } });
    }

    // Call Real Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `You are an AI Assistant for a School Administration Platform. You are talking to a ${roleLabel} of a ${contextType || 'school'}. 
Please answer the following query in a helpful, concise, professional tone relevant to their role. 
Query: "${query}"
Use this context data to answer if relevant: ${JSON.stringify(contextData || {})}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ success: true, data: { answer: text } });
  } catch (error) {
    console.error("Gemini Error:", error);
    // Return 200 so axios doesn't throw. We want the frontend to see the exact API key error!
    res.status(200).json({ success: false, message: `Gemini API Error: ${error.message}` });
  }
});

// GET /api/ai/report - Auto-generated daily/weekly intelligence report
router.get('/report', authenticate, tenantMiddleware, async (req, res) => {
  try {
    const period = req.query.period || 'daily'; // 'daily' or 'weekly'
    const daysBack = period === 'weekly' ? 7 : 1;
    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    // Gather data in parallel from multiple collections
    const AuditLog = require('../models/AuditLog');
    const Admin = require('../models/Admin');
    const Teacher = require('../models/Teacher');
    const Student = require('../models/Student');

    const auditFilter = { timestamp: { $gte: since } };
    if (req.user.role !== 'superadmin' && req.tenant_id && require('mongoose').Types.ObjectId.isValid(req.tenant_id)) {
      auditFilter.tenant_id = req.tenant_id;
    }

    const [recentLogs, totalStudents, totalTeachers] = await Promise.allSettled([
      AuditLog.find(auditFilter).sort({ timestamp: -1 }).limit(50).lean(),
      Student.countDocuments(),
      Teacher.countDocuments(),
    ]);

    const logs = recentLogs.status === 'fulfilled' ? recentLogs.value : [];
    const students = totalStudents.status === 'fulfilled' ? totalStudents.value : 0;
    const teachers = totalTeachers.status === 'fulfilled' ? totalTeachers.value : 0;

    // Summarise actions for Gemini context
    const actionSummary = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {});

    const contextSummary = {
      report_period: period,
      period_hours: daysBack * 24,
      total_actions: logs.length,
      action_breakdown: actionSummary,
      total_students: students,
      total_teachers: teachers,
      generated_at: new Date().toISOString(),
    };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE' || apiKey === 'PASTE_YOUR_REAL_GEMINI_API_KEY_HERE') {
      const fallback = `${period === 'weekly' ? 'Weekly' : 'Daily'} Report Summary: The system recorded ${logs.length} activity events in the past ${daysBack * 24} hours across ${students} students and ${teachers} teachers. Top actions: ${Object.entries(actionSummary).map(([k,v]) => `${k}: ${v}`).join(', ') || 'No activity recorded'}. (Connect Gemini API key for AI-powered analysis.)`;
      return res.json({ success: true, data: { report: fallback, period, context: contextSummary } });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an intelligent school administration analytics AI. Based on the following ${period} system activity data, generate a professional, structured intelligence report in 4-6 sentences. 
Highlight: key activity patterns, any concerns (low logins, spikes in deletions, etc), positive trends, and one actionable recommendation.
Be direct and data-driven. Do NOT use markdown headers or bullet points — write in flowing professional prose.

Data: ${JSON.stringify(contextSummary)}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({ success: true, data: { report: text, period, context: contextSummary } });
  } catch (error) {
    console.error('AI Report Error:', error);
    res.status(200).json({ success: false, message: `Report generation failed: ${error.message}` });
  }
});

module.exports = router;
