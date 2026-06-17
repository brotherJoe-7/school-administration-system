const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/classes
router.get('/', authenticate, async (req, res) => {
  try {
    const { teacher_id, program, semester } = req.query;
    const filter = {};
    if (teacher_id) filter.teacher_id = teacher_id;
    if (program) filter.program = program;
    if (semester) filter.semester = semester;

    const classes = await Class.find(filter)
      .populate('teacher_id', 'first_name last_name')
      .sort({ class_name: 1 });

    const classData = classes.map(c => {
      const teacher = c.teacher_id;
      return {
        ...c.toObject(),
        first_name: teacher ? teacher.first_name : null,
        last_name: teacher ? teacher.last_name : null,
        enrolled: c.students ? c.students.length : 0,
        is_enrolled: req.user && c.students ? c.students.some(s => s.toString() === req.user.id) : false
      };
    });

    res.json({ success: true, data: classData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch classes' });
  }
});

// GET /api/classes/programs — dynamically from DB only
router.get('/programs', async (req, res) => {
  try {
    const programs = await Class.distinct('program');
    res.json({ success: true, data: programs.filter(Boolean).sort() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch programs' });
  }
});

// GET /api/classes/semesters — distinct semesters from DB
router.get('/semesters', async (req, res) => {
  try {
    const { program } = req.query;
    const filter = program ? { program } : {};
    const semesters = await Class.distinct('semester', filter);
    // Sort by Year then Semester number
    const sorted = semesters.filter(Boolean).sort((a, b) => {
      const [ay, as_] = a.match(/\d+/g) || [0, 0];
      const [by, bs] = b.match(/\d+/g) || [0, 0];
      return ay - by || as_ - bs;
    });
    res.json({ success: true, data: sorted });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch semesters' });
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

// PUT /api/classes/:id
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  const { class_name, class_code, teacher_id, program, credit_hours, semester, schedule } = req.body;
  try {
    await Class.findByIdAndUpdate(req.params.id, {
      class_name,
      class_code,
      teacher_id: teacher_id || null,
      program,
      credit_hours: credit_hours || 3,
      semester,
      schedule
    });
    res.json({ success: true, message: 'Class updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update class' });
  }
});

// POST /api/classes/:id/enroll (admin)
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

// POST /api/classes/:id/student-enroll (student self-enrollment)
router.post('/:id/student-enroll', authenticate, authorize('student'), async (req, res) => {
  try {
    const classObj = await Class.findById(req.params.id);
    if (!classObj) return res.status(404).json({ success: false, message: 'Class not found' });
    
    if (classObj.students && classObj.students.includes(req.user.id)) {
      return res.status(400).json({ success: false, message: 'Already enrolled' });
    }

    await Class.findByIdAndUpdate(req.params.id, {
      $addToSet: { students: req.user.id }
    });
    
    res.json({ success: true, message: 'Successfully enrolled in class' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Enrollment failed' });
  }
});

module.exports = router;
