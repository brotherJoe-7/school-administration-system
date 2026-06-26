const express = require('express');
const router = express.Router();
const Tenant = require('../models/Tenant');
const Student = require('../models/Student');

router.get('/stats', async (req, res) => {
  try {
    const schoolsCount = await Tenant.countDocuments();
    const studentsCount = await Student.countDocuments();
    
    res.json({
      success: true,
      data: {
        schoolsOnboarded: schoolsCount,
        studentsManaged: studentsCount
      }
    });
  } catch (err) {
    console.error('Error fetching public stats:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
