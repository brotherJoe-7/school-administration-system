const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const Registration = require('../models/Registration');
const Payment = require('../models/Payment');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/students/count
router.get('/count', authenticate, async (req, res) => {
  try {
    const { program } = req.query;
    let filter = { status: 'active' };
    if (program) {
      const regs = await Registration.find({ program, status: 'approved' }).select('student_id');
      filter._id = { $in: regs.map(r => r.student_id) };
    }
    const count = await Student.countDocuments(filter);
    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to count students' });
  }
});

// GET /api/students - list all students (admin/teacher)
router.get('/', authenticate, authorize('admin', 'teacher'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', program = '', status = '' } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { first_name: { $regex: search, $options: 'i' } },
        { last_name: { $regex: search, $options: 'i' } },
        { student_number: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      filter.status = status;
    }

    if (program) {
      // Find students enrolled in this program from approved registrations
      const registrations = await Registration.find({ program, status: 'approved' });
      const studentIds = registrations.map(r => r.student_id);
      filter._id = { $in: studentIds };
    }

    const total = await Student.countDocuments(filter);
    const students = await Student.find(filter)
      .sort({ created_at: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const studentData = await Promise.all(students.map(async (s) => {
      const reg = await Registration.findOne({ student_id: s._id }).sort({ submitted_at: -1 });
      return {
        ...s.toObject(),
        reg_status: reg ? reg.status : null,
        registration_id: reg ? reg._id : null,
        program: reg ? reg.program : null,
        year_of_study: reg ? reg.year_of_study : null
      };
    }));

    res.json({ success: true, data: studentData, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch students' });
  }
});

// GET /api/students/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    
    const reg = await Registration.findOne({ student_id: student._id }).sort({ submitted_at: -1 });
    
    res.json({ 
      success: true, 
      data: {
        ...student.toObject(),
        reg_status: reg ? reg.status : null,
        program: reg ? reg.program : null,
        year_of_study: reg ? reg.year_of_study : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch student' });
  }
});

// POST /api/students/register - student self-registration
router.post('/register', async (req, res) => {
  const {
    first_name, last_name, email, password, date_of_birth, gender,
    phone, address, program, year_of_study, nationality,
    emergency_contact_name, emergency_contact_phone, consent_gdpr
  } = req.body;

  if (!first_name || !last_name || !email || !password || !program) {
    return res.status(400).json({ success: false, message: 'Required fields missing' });
  }

  if (!consent_gdpr) {
    return res.status(400).json({ success: false, message: 'GDPR consent is required' });
  }

  try {
    const existing = await Student.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 12);
    const year = new Date().getFullYear();
    const count = await Student.countDocuments({
      created_at: {
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31T23:59:59.999Z`)
      }
    });
    const studentNumber = `SAS${year}${String(count + 1).padStart(4, '0')}`;

    const student = await Student.create({
      student_number: studentNumber,
      first_name,
      last_name,
      email,
      password_hash: hash,
      date_of_birth,
      gender,
      phone,
      address,
      nationality,
      emergency_contact_name,
      emergency_contact_phone,
      consent_gdpr: !!consent_gdpr,
      status: 'pending'
    });

    await Registration.create({
      student_id: student._id,
      program,
      year_of_study: year_of_study || 1,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully. Await admin approval.',
      student_number: studentNumber,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// PUT /api/students/:id (admin update)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  const { first_name, last_name, email, phone, address, status } = req.body;
  try {
    await Student.findByIdAndUpdate(req.params.id, {
      first_name,
      last_name,
      email,
      phone,
      address,
      status
    });
    res.json({ success: true, message: 'Student updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

// GET /api/students/:id/payments
router.get('/:id/payments', authenticate, async (req, res) => {
  try {
    const payments = await Payment.find({ student_id: req.params.id }).sort({ payment_date: -1 });
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch payments' });
  }
});

// POST /api/students/:id/payments
router.post('/:id/payments', authenticate, authorize('admin'), async (req, res) => {
  const { amount_paid, amount_due, payment_date, payment_method, reference, semester } = req.body;
  try {
    await Payment.create({
      student_id: req.params.id,
      amount_paid,
      amount_due,
      payment_date,
      payment_method,
      reference,
      semester,
      status: 'pending'
    });
    res.status(201).json({ success: true, message: 'Payment recorded' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to record payment' });
  }
});

// PUT /api/students/payments/:paymentId/verify
router.put('/payments/:paymentId/verify', authenticate, authorize('admin'), async (req, res) => {
  try {
    await Payment.findByIdAndUpdate(req.params.paymentId, {
      status: 'verified',
      verified_at: new Date(),
      verified_by: req.user.id
    });
    res.json({ success: true, message: 'Payment verified' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

module.exports = router;
