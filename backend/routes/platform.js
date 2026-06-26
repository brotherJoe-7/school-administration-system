const express = require('express');
const router = express.Router();
const Tenant = require('../models/Tenant');
const AuditLog = require('../models/AuditLog');
const Student = require('../models/Student');

// GET /api/platform/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const schools = await Tenant.find().select('-db_password').lean();
    const totalStudents = await Student.countDocuments();
    const recentAudits = await AuditLog.find().sort({ timestamp: -1 }).limit(10).lean();
    
    // Calculate mock MRR based on schools
    const mrr = schools.length * 29; // Assuming growth plan avg
    
    res.json({
      success: true,
      data: {
        totalSchools: schools.length,
        totalStudents,
        mrr: mrr > 0 ? mrr : 12450, // mock fallback if 0
        schools,
        recentAudits
      }
    });
  } catch (err) {
    console.error('Platform error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
