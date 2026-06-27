const express = require('express');
const router = express.Router();
const Parent = require('../models/Parent');
const Student = require('../models/Student');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/parents/dashboard - Get children and their stats
router.get('/dashboard', authenticate, authorize('parent'), async (req, res) => {
  try {
    const parent = await Parent.findById(req.user.id).populate('student_ids');
    if (!parent) return res.status(404).json({ success: false, message: 'Parent not found' });

    const childrenData = [];
    
    for (const student of parent.student_ids) {
      // Get registrations
      const registrations = await Registration.find({ student_id: student._id });
      
      // Get attendance
      const attendanceRecords = await Attendance.find({ 
        'records.student_id': student._id 
      });
      
      let presentCount = 0;
      let totalDays = 0;
      
      attendanceRecords.forEach(att => {
        const record = att.records.find(r => r.student_id.toString() === student._id.toString());
        if (record) {
          totalDays++;
          if (record.status === 'present') presentCount++;
        }
      });
      
      const attendanceRate = totalDays > 0 ? ((presentCount / totalDays) * 100).toFixed(1) : 100;
      
      // Get Payments
      const payments = await Payment.find({ student_id: student._id }).sort({ payment_date: -1 });
      
      childrenData.push({
        id: student._id,
        name: `${student.first_name} ${student.last_name}`,
        student_number: student.student_number,
        registrations,
        attendanceRate,
        payments
      });
    }

    res.json({
      success: true,
      data: childrenData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
