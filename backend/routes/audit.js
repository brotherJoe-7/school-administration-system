const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/audit - Get all audit logs (admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.action) filter.action = req.query.action;
    if (req.query.role) filter.user_role = req.query.role;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter)
    ]);

    // Enrich logs with user names
    const enrichedLogs = await Promise.all(logs.map(async (log) => {
      let userName = 'System';
      if (log.user_id) {
        try {
          // Try to find user in different collections based on role
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

    res.json({
      success: true,
      data: enrichedLogs,
      total,
      page,
      limit
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
});

module.exports = router;
