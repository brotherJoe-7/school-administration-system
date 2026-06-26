const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const Registration = require('../models/Registration');
const Payroll = require('../models/Payroll');
const { authenticate, authorize } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenantMiddleware');
// Helper: build a date range filter
function buildDateFilter(field, startDate, endDate) {
  const now = new Date();
  if (startDate && endDate) {
    return { [field]: { $gte: new Date(startDate), $lte: new Date(endDate) } };
  }
  // Default: current month
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { [field]: { $gte: start, $lte: end } };
}

// GET /api/dashboard/stats
router.get('/stats', authenticate, tenantMiddleware, async (req, res) => {
  try {
    const { program, startDate, endDate } = req.query;

    let classIdsForRole = null;
    let studentIdsForRole = null;

    if (req.user.role === 'teacher') {
      const teacherClasses = await Class.find({ teacher_id: req.user.id, tenant_id: req.tenant_id }).select('_id students');
      classIdsForRole = teacherClasses.map(c => c._id);
      studentIdsForRole = [...new Set(teacherClasses.flatMap(c => c.students.map(id => id.toString())))];
    } else if (req.user.role === 'student') {
      const studentClasses = await Class.find({ students: req.user.id, tenant_id: req.tenant_id }).select('_id');
      classIdsForRole = studentClasses.map(c => c._id);
      studentIdsForRole = [req.user.id];
    }

    // --- Total students ---
    let studentFilter = { status: 'active', tenant_id: req.tenant_id };
    if (studentIdsForRole) {
      studentFilter._id = { $in: studentIdsForRole };
    }
    if (program) {
      const classesInProgram = await Class.find({ program }).select('students');
      const programStudentIds = classesInProgram.flatMap(c => c.students.map(id => id.toString()));
      if (studentFilter._id) {
        studentFilter._id.$in = studentFilter._id.$in.filter(id => programStudentIds.includes(id));
      } else {
        studentFilter._id = { $in: programStudentIds };
      }
    }
    const total_students = await Student.countDocuments(studentFilter);

    // --- Total teachers ---
    let teacherFilter = { status: 'active', tenant_id: req.tenant_id };
    if (req.user.role === 'teacher') teacherFilter._id = req.user.id;
    if (program) {
      const teachersInProgram = await Class.find({ program }).distinct('teacher_id');
      teacherFilter._id = { $in: teachersInProgram };
    }
    const total_teachers = await Teacher.countDocuments(teacherFilter);

    // --- Total classes ---
    const classFilter = program ? { program, tenant_id: req.tenant_id } : { tenant_id: req.tenant_id };
    if (classIdsForRole) {
      classFilter._id = { $in: classIdsForRole };
    }
    const total_classes = await Class.countDocuments(classFilter);

    // --- Tuition collected ---
    const paymentMatch = { status: 'verified', tenant_id: req.tenant_id };
    if (startDate && endDate) {
      paymentMatch.payment_date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (studentIdsForRole) {
      paymentMatch.student_id = { $in: studentIdsForRole };
    }
    if (program) {
      const studentsInProgram = (await Class.find({ program }).select('students')).flatMap(c => c.students);
      paymentMatch.student_id = paymentMatch.student_id 
        ? { $in: paymentMatch.student_id.$in.filter(id => studentsInProgram.includes(id)) }
        : { $in: studentsInProgram };
    }
    const tuitionResult = await Payment.aggregate([
      { $match: paymentMatch },
      { $group: { _id: null, total: { $sum: '$amount_paid' } } }
    ]);
    const tuition_collected = tuitionResult[0]?.total || 0;

    // --- Attendance rate ---
    const attDateFilter = buildDateFilter('date', startDate, endDate);
    const attMatch = { ...attDateFilter, tenant_id: req.tenant_id };
    if (classIdsForRole) {
      attMatch.class_id = { $in: classIdsForRole };
    }
    if (req.user.role === 'student') {
      attMatch.student_id = req.user.id;
    }
    if (program) {
      const classIds = (await Class.find({ program }).select('_id')).map(c => c._id);
      attMatch.class_id = attMatch.class_id 
        ? { $in: attMatch.class_id.$in.filter(id => classIds.some(cid => cid.toString() === id.toString())) }
        : { $in: classIds };
    }
    const attResult = await Attendance.aggregate([
      { $match: attMatch },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
      }}
    ]);
    const attData = attResult[0] || { total: 0, present: 0 };
    const attendance_rate = attData.total > 0
      ? parseFloat(((attData.present / attData.total) * 100).toFixed(1))
      : 0;

    // --- Pending registrations ---
    let pending_registrations = 0;
    if (req.user.role === 'admin') {
      const pendingFilter = { status: 'pending', tenant_id: req.tenant_id };
      if (program) pendingFilter.program = program;
      pending_registrations = await Registration.countDocuments(pendingFilter);
    }

    res.json({
      success: true,
      data: { total_students, total_teachers, total_classes, tuition_collected, attendance_rate, pending_registrations }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
});

// GET /api/dashboard/attendance-trend
router.get('/attendance-trend', authenticate, tenantMiddleware, async (req, res) => {
  try {
    const { program, startDate, endDate } = req.query;

    const now = new Date();
    const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dateFrom = startDate ? new Date(startDate) : defaultStart;
    const dateTo = endDate ? new Date(endDate) : now;

    const match = { date: { $gte: dateFrom, $lte: dateTo }, tenant_id: req.tenant_id };

    if (req.user.role === 'teacher') {
      const teacherClasses = await Class.find({ teacher_id: req.user.id, tenant_id: req.tenant_id }).select('_id');
      match.class_id = { $in: teacherClasses.map(c => c._id) };
    } else if (req.user.role === 'student') {
      match.student_id = req.user.id;
    }

    if (program) {
      const classIds = (await Class.find({ program }).select('_id')).map(c => c._id);
      if (match.class_id) {
        match.class_id.$in = match.class_id.$in.filter(id => classIds.some(cid => cid.toString() === id.toString()));
      } else {
        match.class_id = { $in: classIds };
      }
    }

    const rows = await Attendance.aggregate([
      { $match: match },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        absent:  { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } }
      }},
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', present: 1, absent: 1 } }
    ]);

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch attendance trend' });
  }
});

// GET /api/dashboard/tuition-progress
router.get('/tuition-progress', authenticate, tenantMiddleware, async (req, res) => {
  try {
    const { program, startDate, endDate } = req.query;

    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const dateFrom = startDate ? new Date(startDate) : defaultStart;
    const dateTo = endDate ? new Date(endDate) : now;

    const match = { status: 'verified', payment_date: { $gte: dateFrom, $lte: dateTo }, tenant_id: req.tenant_id };

    if (req.user.role === 'student') {
      match.student_id = req.user.id;
    }

    if (program) {
      const studentsInProgram = (await Class.find({ program }).select('students')).flatMap(c => c.students);
      if (match.student_id) {
        // if user is student, we don't really need to filter by program unless they want to, but let's be safe
      } else {
        match.student_id = { $in: studentsInProgram };
      }
    }

    const rows = await Payment.aggregate([
      { $match: match },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$payment_date' } },
        collected: { $sum: '$amount_paid' },
        expected:  { $sum: '$amount_due' }
      }},
      { $sort: { _id: 1 } },
      { $project: { _id: 0, month: '$_id', collected: 1, expected: 1 } }
    ]);

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch tuition progress' });
  }
});

// GET /api/dashboard/payroll-summary
router.get('/payroll-summary', authenticate, authorize('admin'), tenantMiddleware, async (req, res) => {
  try {
    const { program, startDate, endDate } = req.query;

    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const dateFrom = startDate ? new Date(startDate) : defaultStart;
    const dateTo = endDate ? new Date(endDate) : now;

    const match = { pay_period: { $gte: dateFrom, $lte: dateTo }, tenant_id: req.tenant_id };

    if (program) {
      const teacherIds = (await Class.find({ program }).distinct('teacher_id'));
      match.teacher_id = { $in: teacherIds };
    }

    const rows = await Payroll.aggregate([
      { $match: match },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$pay_period' } },
        total_net_pay:    { $sum: '$net_pay' },
        total_salary:     { $sum: '$salary_amount' },
        total_allowances: { $sum: '$allowances' },
        total_deductions: { $sum: '$deductions' }
      }},
      { $sort: { _id: 1 } },
      { $project: { _id: 0, month: '$_id', total_net_pay: 1, total_salary: 1, total_allowances: 1, total_deductions: 1 } }
    ]);

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch payroll summary' });
  }
});

module.exports = router;
