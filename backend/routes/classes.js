const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/classes
router.get('/', authenticate, async (req, res) => {
  try {
    const { teacher_id, program } = req.query;
    const filter = {};
    if (teacher_id) filter.teacher_id = teacher_id;
    if (program) filter.program = program;

    const classes = await Class.find(filter)
      .populate('teacher_id', 'first_name last_name')
      .sort({ class_name: 1 });

    const classData = classes.map(c => {
      const teacher = c.teacher_id;
      return {
        ...c.toObject(),
        first_name: teacher ? teacher.first_name : null,
        last_name: teacher ? teacher.last_name : null,
        enrolled: c.students ? c.students.length : 0
      };
    });

    res.json({ success: true, data: classData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch classes' });
  }
});

// GET /api/classes/programs
router.get('/programs', async (req, res) => {
  try {
    const programs = await Class.distinct('program');
    const defaults = ['BIT', 'BBIT', 'BSEM', 'BICT', 'DAT', 'BSc CS', 'BBA MIS', 'Diploma ICT', 'HND Computing'];
    const combined = Array.from(new Set([...programs, ...defaults])).filter(Boolean);
    res.json({ success: true, data: combined });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch programs' });
  }
});

// GET /api/classes/count
router.get('/count', authenticate, async (req, res) => {
  try {
    const { program } = req.query;
    const filter = program ? { program } : {};
    const count = await Class.countDocuments(filter);
    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to count classes' });
  }
});

// GET /api/classes/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id)
      .populate('teacher_id', 'first_name last_name')
      .populate('students', 'id student_number first_name last_name');
    
    if (!classItem) return res.status(404).json({ success: false, message: 'Class not found' });

    const teacher = classItem.teacher_id;
    res.json({ 
      success: true, 
      data: {
        ...classItem.toObject(),
        first_name: teacher ? teacher.first_name : null,
        last_name: teacher ? teacher.last_name : null,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch class' });
  }
});

// POST /api/classes
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  const { class_name, class_code, teacher_id, program, credit_hours, semester, schedule } = req.body;
  try {
    const newClass = await Class.create({
      class_name,
      class_code,
      teacher_id: teacher_id || null,
      program,
      credit_hours: credit_hours || 3,
      semester,
      schedule
    });
    res.status(201).json({ success: true, message: 'Class created', id: newClass._id });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create class' });
  }
});

// POST /api/classes/:id/enroll
router.post('/:id/enroll', authenticate, authorize('admin'), async (req, res) => {
  const { student_ids } = req.body;
  try {
    await Class.findByIdAndUpdate(req.params.id, {
      $addToSet: { students: { $each: student_ids } }
    });
    res.json({ success: true, message: `${student_ids.length} student(s) enrolled` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Enrollment failed' });
  }
});

module.exports = router;
