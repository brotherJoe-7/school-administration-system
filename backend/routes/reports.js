const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Class = require('../models/Class');
const Registration = require('../models/Registration');
const ReportCard = require('../models/ReportCard');
const Transcript = require('../models/Transcript');
const Attendance = require('../models/Attendance');
const { authenticate, authorize } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenantMiddleware');

// Grade → GPA points helper
function gradeToPoints(grade) {
  const map = { 'A+': 4.0, 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
                'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0 };
  return map[grade] ?? 0;
}

// GET /api/reports/student/:studentId/transcript
router.get('/student/:studentId/transcript', authenticate, tenantMiddleware, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Students can only view their own transcript
    if (req.user.role === 'student' && req.user.id !== studentId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const studentFilter = { _id: studentId };
    if (req.tenant_id) studentFilter.tenant_id = req.tenant_id;
    const student = await Student.findOne(studentFilter).select('-password_hash');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const regFilter = { student_id: studentId, status: 'approved' };
    if (req.tenant_id) regFilter.tenant_id = req.tenant_id;
    const registration = await Registration.findOne(regFilter);

    const gradeFilter = { student_id: studentId };
    if (req.tenant_id) gradeFilter.tenant_id = req.tenant_id;
    if (req.query.semester) gradeFilter.semester = req.query.semester;

    const grades = await ReportCard.find(gradeFilter)
      .populate('class_id', 'class_name credit_hours')
      .populate('entered_by', 'first_name last_name')
      .sort({ semester: 1 });

    // Build semester map and calculate cumulative GPA
    let totalPoints = 0;
    let totalCredits = 0;
    const semesters = {};

    grades.forEach(g => {
      const semKey = g.semester;
      if (!semesters[semKey]) semesters[semKey] = { grades: [], gpa: 0, total_credits: 0 };

      const gradePoints = gradeToPoints(g.grade);
      const credits = g.class_id?.credit_hours || 3;

      semesters[semKey].grades.push({
        ...g.toObject(),
        class_name: g.class_id?.class_name,
        credit_hours: credits,
        teacher_first: g.entered_by?.first_name,
        teacher_last: g.entered_by?.last_name,
      });

      totalPoints += gradePoints * credits;
      totalCredits += credits;
      semesters[semKey].total_credits += credits;
    });

    // Calculate per-semester GPA
    Object.keys(semesters).forEach(sem => {
      let sp = 0, sc = 0;
      semesters[sem].grades.forEach(g => {
        const credits = g.credit_hours || 3;
        sp += gradeToPoints(g.grade) * credits;
        sc += credits;
      });
      semesters[sem].gpa = sc > 0 ? parseFloat((sp / sc).toFixed(2)) : 0;
    });

    const cumulativeGPA = totalCredits > 0
      ? parseFloat((totalPoints / totalCredits).toFixed(2))
      : 0;

    // Attendance summary
    const attFilter = { student_id: studentId };
    if (req.tenant_id) attFilter.tenant_id = req.tenant_id;
    const attRecords = await Attendance.find(attFilter);
    const total = attRecords.length;
    const present = attRecords.filter(a => a.status === 'present').length;
    const attPct = total > 0 ? parseFloat(((present / total) * 100).toFixed(1)) : 0;

    res.json({
      success: true,
      data: {
        student: {
          ...student.toObject(),
          program: registration?.program,
          year_of_study: registration?.year_of_study
        },
        semesters,
        cumulative_gpa: cumulativeGPA,
        total_credits: totalCredits,
        attendance_percentage: attPct,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to generate transcript' });
  }
});

// GET /api/reports/cards - get all report cards (admin/teacher)
router.get('/cards', authenticate, authorize('admin', 'teacher'), tenantMiddleware, async (req, res) => {
  try {
    const { student_id, class_id, semester } = req.query;
    const filter = { tenant_id: req.tenant_id };
    if (student_id) filter.student_id = student_id;
    if (class_id) filter.class_id = class_id;
    if (semester) filter.semester = semester;

    const cards = await ReportCard.find(filter)
      .populate('student_id', 'first_name last_name student_number')
      .populate('class_id', 'class_name')
      .sort({ semester: -1 });

    const data = cards.map(c => ({
      ...c.toObject(),
      first_name: c.student_id?.first_name,
      last_name: c.student_id?.last_name,
      student_number: c.student_id?.student_number,
      class_name: c.class_id?.class_name,
    }));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch report cards' });
  }
});

// POST /api/reports/cards - teacher enters grades
router.post('/cards', authenticate, authorize('admin', 'teacher'), tenantMiddleware, async (req, res) => {
  const { student_id, class_id, semester, grade, score, comments } = req.body;
  try {
    await ReportCard.findOneAndUpdate(
      { student_id, class_id, semester, tenant_id: req.tenant_id },
      { grade, score, comments, entered_by: req.user.id },
      { upsert: true, new: true }
    );
    res.status(201).json({ success: true, message: 'Grade recorded' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to record grade' });
  }
});

// GET /api/reports/transcripts - list all transcripts (admin)
router.get('/transcripts', authenticate, authorize('admin'), tenantMiddleware, async (req, res) => {
  try {
    const transcripts = await Transcript.find({ tenant_id: req.tenant_id })
      .populate('student_id', 'first_name last_name student_number')
      .sort({ requested_at: -1 });

    const data = transcripts.map(t => ({
      ...t.toObject(),
      first_name: t.student_id?.first_name,
      last_name: t.student_id?.last_name,
      student_number: t.student_id?.student_number,
    }));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch transcripts' });
  }
});

// POST /api/reports/transcripts/request
router.post('/transcripts/request', authenticate, tenantMiddleware, async (req, res) => {
  const studentId = req.user.role === 'student' ? req.user.id : req.body.student_id;
  try {
    await Transcript.create({ tenant_id: req.tenant_id,  student_id: studentId, status: 'pending', tenant_id: req.tenant_id });
    res.status(201).json({ success: true, message: 'Transcript request submitted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Request failed' });
  }
});

module.exports = router;
