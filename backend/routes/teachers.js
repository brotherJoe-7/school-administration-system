const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/teachers/count
router.get('/count', authenticate, async (req, res) => {
  try {
    const { program } = req.query;
    let filter = { status: 'active' };
    if (program) {
      const teacherIds = await Class.find({ program }).distinct('teacher_id');
      filter._id = { $in: teacherIds };
    }
    const count = await Teacher.countDocuments(filter);
    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to count teachers' });
  }
});

// GET /api/teachers
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { first_name: { $regex: search, $options: 'i' } },
        { last_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Teacher.countDocuments(filter);
    const teachers = await Teacher.find(filter)
      .select('-password_hash')
      .sort({ created_at: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({ success: true, data: teachers, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch teachers' });
  }
});

// GET /api/teachers/:id
router.get('/:id', authenticate, authorize('admin', 'teacher'), async (req, res) => {
  try {
    const targetId = req.user.role === 'teacher' ? req.user.id : req.params.id;
    const teacher = await Teacher.findById(targetId).select('-password_hash');
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
    res.json({ success: true, data: teacher });
  } catch (error) {
    console.error('Error fetching teacher:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch teacher' });
  }
});

// POST /api/teachers (admin creates teacher)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  const { first_name, last_name, email, password, phone, department, specialization } = req.body;
  try {
    const existing = await Teacher.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already exists' });

    const hash = await bcrypt.hash(password || 'Teacher@123', 12);
    const year = new Date().getFullYear();
    const count = await Teacher.countDocuments({
      created_at: {
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31T23:59:59.999Z`)
      }
    });
    const teacherNumber = `TCH${year}${String(count + 1).padStart(3, '0')}`;

    await Teacher.create({
      teacher_number: teacherNumber,
      first_name,
      last_name,
      email,
      password_hash: hash,
      phone,
      department,
      specialization,
      status: 'active'
    });
    res.status(201).json({ success: true, message: 'Teacher created', teacher_number: teacherNumber });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create teacher' });
  }
});

// PUT /api/teachers/:id
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  const { first_name, last_name, email, phone, department, specialization, status } = req.body;
  try {
    await Teacher.findByIdAndUpdate(req.params.id, {
      first_name,
      last_name,
      email,
      phone,
      department,
      specialization,
      status
    });
    res.json({ success: true, message: 'Teacher updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

// DELETE /api/teachers/:id (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
    
    await Teacher.findByIdAndDelete(req.params.id);
    // Optionally handle related classes by unassigning them
    await Class.updateMany({ teacher_id: req.params.id }, { $unset: { teacher_id: 1 } });
    
    res.json({ success: true, message: 'Teacher deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete teacher' });
  }
});

// POST /api/teachers/:id/promote (admin only)
router.post('/:id/promote', authenticate, authorize('admin'), async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
    
    // Create an Admin using the teacher's data
    const Admin = require('../models/Admin');
    await Admin.create({
      full_name: `${teacher.first_name} ${teacher.last_name}`,
      email: teacher.email,
      password_hash: teacher.password_hash,
      status: 'active'
    });
    
    // Delete the teacher
    await Teacher.findByIdAndDelete(req.params.id);
    // Unassign classes
    await Class.updateMany({ teacher_id: req.params.id }, { $unset: { teacher_id: 1 } });
    
    res.json({ success: true, message: 'Teacher successfully promoted to Admin' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'An Admin with this email already exists' });
    }
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to promote teacher' });
  }
});

// GET /api/teachers/:id/classes
router.get('/:id/classes', authenticate, async (req, res) => {
  try {
    const classes = await Class.find({ teacher_id: req.params.id });
    const classData = classes.map(c => ({
      ...c.toObject(),
      student_count: c.students ? c.students.length : 0
    }));
    res.json({ success: true, data: classData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch classes' });
  }
});

module.exports = router;
