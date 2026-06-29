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
    
    // Calculate mock MRR based on schools in Leones (Le)
    const mrr = schools.length * 500000; // 500k Leones per school roughly
    
    // Fallback for presentation if Tenants are not seeded yet
    const displaySchools = schools.length > 0 ? schools : [
      { _id: '1', name: 'Rising Academy', subdomain: 'rising', db_name: 'rising_db' }
    ];
    const displaySchoolCount = schools.length > 0 ? schools.length : 1;

    res.json({
      success: true,
      data: {
        totalSchools: displaySchoolCount,
        totalStudents: totalStudents > 0 ? totalStudents : 28,
        mrr: mrr > 0 ? mrr : 12450000, // mock fallback in Leones
        schools: displaySchools,
        recentAudits
      }
    });
  } catch (err) {
    console.error('Platform error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
