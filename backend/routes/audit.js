const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { authenticate, authorize } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenantMiddleware');

// GET /api/audit - Get audit logs (admin sees all, others see their own)
router.get('/', authenticate, tenantMiddleware, async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    // Support SuperAdmin viewing all logs, or default to tenant
    const filter = {};
    if (req.user.role !== 'superadmin') {
      const mongoose = require('mongoose');
      if (req.tenant_id && mongoose.Types.ObjectId.isValid(req.tenant_id)) {
        filter.tenant_id = req.tenant_id;
      }
    }

    // Non-admins only see their own activity
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      filter.user_id = req.user.id;
    }

    if (req.query.action) filter.action = req.query.action;
    if (req.query.role)   filter.user_role = req.query.role;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(filter)
    ]);

    // Enrich logs with user names
    const enrichedLogs = await Promise.all(logs.map(async (log) => {
      let userName = 'System';
      if (log.user_id) {
        try {
          if (log.user_role === 'admin') {
            const Admin = require('../models/Admin');
            const admin = await Admin.findById(log.user_id).select('full_name');
            if (admin) userName = admin.full_name;
          } else if (log.user_role === 'teacher') {
            const Teacher = require('../models/Teacher');
            const teacher = await Teacher.findById(log.user_id).select('first_name last_name');
            if (teacher) userName = `${teacher.first_name} ${teacher.last_name}`;
          } else if (log.user_role === 'student') {
            const Student = require('../models/Student');
            const student = await Student.findById(log.user_id).select('first_name last_name');
            if (student) userName = `${student.first_name} ${student.last_name}`;
          }
        } catch (err) {
          console.error('Error fetching user name:', err);
        }
      }
      return { ...log, user_name: userName };
    }));

    res.json({ success: true, data: enrichedLogs, total, page, limit });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
});

// GET /api/audit/recent - Get last 5 logs for dashboard widget
router.get('/recent', authenticate, tenantMiddleware, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role !== 'superadmin') {
      const mongoose = require('mongoose');
      if (req.tenant_id && mongoose.Types.ObjectId.isValid(req.tenant_id)) {
        filter.tenant_id = req.tenant_id;
      }
    }

    // Non-admins only see their own recent activity
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      filter.user_id = req.user.id;
    }

    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(8)
      .lean();

    const enriched = await Promise.all(logs.map(async (log) => {
      let userName = 'System';
      if (log.user_id) {
        try {
          if (log.user_role === 'admin') {
            const Admin = require('../models/Admin');
            const admin = await Admin.findById(log.user_id).select('full_name');
            if (admin) userName = admin.full_name;
          } else if (log.user_role === 'teacher') {
            const Teacher = require('../models/Teacher');
            const teacher = await Teacher.findById(log.user_id).select('first_name last_name');
            if (teacher) userName = `${teacher.first_name} ${teacher.last_name}`;
          } else if (log.user_role === 'student') {
            const Student = require('../models/Student');
            const student = await Student.findById(log.user_id).select('first_name last_name');
            if (student) userName = `${student.first_name} ${student.last_name}`;
          }
        } catch (err) { /* silent */ }
      }
      return { ...log, user_name: userName };
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch recent activity' });
  }
});

module.exports = router;
