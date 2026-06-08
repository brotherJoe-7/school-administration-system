const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const AuditLog = require('../models/AuditLog');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/attendance/rate
router.get('/rate', authenticate, async (req, res) => {
  try {
    const { program, startDate, endDate } = req.query;
    const match = {};

    if (startDate && endDate) {
      match.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    if (program) {
      const classIds = (await Class.find({ program }).select('_id')).map(c => c._id);
      match.class_id = { $in: classIds };
    }

    const result = await Attendance.aggregate([
      { $match: match },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
      }}
    ]);

    const data = result[0] || { total: 0, present: 0 };
    const rate = data.total > 0 ? parseFloat(((data.present / data.total) * 100).toFixed(1)) : 0;
    
    res.json({ success: true, data: { rate } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to calculate attendance rate' });
  }
});

// GET /api/attendance - fetch attendance records
router.get('/', authenticate, async (req, res) => {
  try {
    const { class_id, date, student_id } = req.query;
    const filter = {};

    if (class_id) filter.class_id = class_id;
    if (date) filter.date = new Date(date);
    if (student_id) filter.student_id = student_id;

    if (req.user.role === 'student') {
      filter.student_id = req.user.id;
    }

    const records = await Attendance.find(filter)
      .populate('student_id', 'first_name last_name student_number')
      .populate('class_id', 'class_name')
      .sort({ date: -1 });

    const formatted = records.map(a => {
      const s = a.student_id;
      const c = a.class_id;
      return {
        ...a.toObject(),
        first_name: s ? s.first_name : null,
        last_name: s ? s.last_name : null,
        student_number: s ? s.student_number : null,
        class_name: c ? c.class_name : null
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch attendance' });
  }
});

// GET /api/attendance/class/:classId/date/:date - get class roster for a day
router.get('/class/:classId/date/:date', authenticate, authorize('admin', 'teacher'), async (req, res) => {
  try {
    const { classId, date } = req.params;
    const targetDate = new Date(date);

    const classItem = await Class.findById(classId).populate('students');
    if (!classItem) return res.status(404).json({ success: false, message: 'Class not found' });

    const attendanceRecords = await Attendance.find({
      class_id: classId,
      date: targetDate
    });

    const attMap = {};
    attendanceRecords.forEach(a => {
      attMap[a.student_id.toString()] = { status: a.status, id: a._id };
    });

    const studentsRoster = (classItem.students || [])
      .filter(s => s.status === 'active')
      .map(s => {
        const att = attMap[s._id.toString()];
        return {
          student_id: s._id,
          student_number: s.student_number,
          first_name: s.first_name,
          last_name: s.last_name,
          status: att ? att.status : 'not_recorded',
          attendance_id: att ? att.id : null
        };
      });

    res.json({ success: true, data: studentsRoster, date, class_id: classId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch class roster' });
  }
});

// POST /api/attendance/submit - submit attendance for a class
router.post('/submit', authenticate, authorize('admin', 'teacher'), async (req, res) => {
  const { class_id, date, records } = req.body;

  if (!class_id || !date || !Array.isArray(records)) {
    return res.status(400).json({ success: false, message: 'class_id, date, and records are required' });
  }

  try {
    const targetDate = new Date(date);

    for (const record of records) {
      const { student_id, status } = record;
      await Attendance.findOneAndUpdate(
        { student_id, class_id, date: targetDate },
        { status, recorded_by: req.user.id },
        { upsert: true, new: true }
      );
    }

    // Log the attendance submission in AuditLog
    await AuditLog.create({
      user_id: req.user.id,
      user_role: req.user.role,
      action: 'SUBMIT_ATTENDANCE',
      entity_type: 'Class',
      entity_id: class_id,
      notes: `Attendance recorded for class ${class_id} on ${date}. Total records: ${records.length}.`
    }).catch(err => console.error('Failed to log audit:', err));

    res.json({ success: true, message: `Attendance recorded for ${records.length} students` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to submit attendance' });
  }
});

// GET /api/attendance/report/student/:studentId
router.get('/report/student/:studentId', authenticate, async (req, res) => {
  try {
    const records = await Attendance.find({ student_id: req.params.studentId }).populate('class_id', 'class_name');
    const grouped = {};

    records.forEach(r => {
      const cid = r.class_id?._id.toString();
      if (!cid) return;
      if (!grouped[cid]) {
        grouped[cid] = {
          class_name: r.class_id.class_name,
          total_days: 0,
          present_days: 0,
          absent_days: 0
        };
      }
      grouped[cid].total_days++;
      if (r.status === 'present') {
        grouped[cid].present_days++;
      } else if (r.status === 'absent') {
        grouped[cid].absent_days++;
      }
    });

    const data = Object.keys(grouped).map(cid => {
      const g = grouped[cid];
      return {
        class_name: g.class_name,
        total_days: g.total_days,
        present_days: g.present_days,
        absent_days: g.absent_days,
        attendance_pct: g.total_days > 0 ? parseFloat(((g.present_days / g.total_days) * 100).toFixed(1)) : 0
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
});

module.exports = router;
