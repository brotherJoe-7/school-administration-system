const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const Registration = require('../models/Registration');
const Payment = require('../models/Payment');
const Tenant = require('../models/Tenant');
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
      const studentObj = s.toObject();
      delete studentObj.password_hash;
      return {
        ...studentObj,
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
    const student = await Student.findById(req.params.id).select('-password_hash');
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

// POST /api/students/register - Admin creates a new student
router.post('/register', authenticate, authorize('admin'), async (req, res) => {
  const {
    first_name, last_name, email, date_of_birth, gender,
    phone, address, program, year_of_study, nationality,
    emergency_contact_name, emergency_contact_phone
  } = req.body;

  if (!first_name || !last_name || !program) {
    return res.status(400).json({ success: false, message: 'Required fields missing' });
  }

  try {
    if (email) {
      const existingEmail = await Student.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }
    }

    const year = new Date().getFullYear();
    const count = await Student.countDocuments({
      created_at: {
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31T23:59:59.999Z`)
      }
    });
    // Auto-generate ID using custom tenant prefix
    const tenant = await Tenant.findOne({ subdomain: req.tenant_id });
    const prefix = tenant && tenant.id_prefix ? tenant.id_prefix : '90500';
    const student_number = `${prefix}${String(count + 1).padStart(4, '0')}`;

    // Sanitize empty strings
    const sanitize = (val) => val === '' ? undefined : val;

    const student = await Student.create({ tenant_id: req.tenant_id, 
      student_number: student_number,
      first_name: sanitize(first_name),
      last_name: sanitize(last_name),
      email: sanitize(email) || `pending_${student_number}@schooladmin.edu`,
      password_hash: 'pending',
      date_of_birth: sanitize(date_of_birth),
      gender: sanitize(gender),
      phone: sanitize(phone),
      address: sanitize(address),
      nationality: sanitize(nationality),
      emergency_contact_name: sanitize(emergency_contact_name),
      emergency_contact_phone: sanitize(emergency_contact_phone),
      program: sanitize(program),
      year_of_study: sanitize(year_of_study) || 1,
      consent_gdpr: false,
      status: 'active'
    });

    await Registration.create({ tenant_id: req.tenant_id, 
      student_id: student._id,
      program,
      year_of_study: year_of_study || 1,
      status: 'approved'
    });

    const AuditLog = require('../models/AuditLog');
    AuditLog.create({
      tenant_id: req.tenant_id || null,
      user_id: req.user.id,
      user_role: req.user.role,
      action: 'CREATE_STUDENT',
      entity_type: 'Student',
      entity_id: student._id,
      notes: `Registered new student ${first_name} ${last_name} (${student_number})`
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Student created successfully. They can now use the Setup Link to claim their account.',
      student_number: student_number,
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate record exists (email or student number).' });
    }
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// PUT /api/students/complete-setup
router.put('/complete-setup', authenticate, async (req, res) => {
  const { email, password, consent_gdpr } = req.body;

  if (!email || !password || !consent_gdpr) {
    return res.status(400).json({ success: false, message: 'Email, password, and GDPR consent are required' });
  }

  try {
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    
    // Check if email already used by another user
    const existing = await Student.findOne({ email, _id: { $ne: student._id } });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    
    await Student.findByIdAndUpdate(student._id, {
      email,
      password_hash: hash,
      consent_gdpr: true
    });

    res.json({ success: true, message: 'Setup completed successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Setup failed' });
  }
});

// PUT /api/students/:id (admin update)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  const { first_name, last_name, email, phone, address, status } = req.body;
  const AuditLog = require('../models/AuditLog');
  try {
    // Fetch the current record first so we can write a clean audit note
    const existing = await Student.findById(req.params.id).select('first_name last_name student_number');
    if (!existing) return res.status(404).json({ success: false, message: 'Student not found' });

    const updateFields = {};
    if (first_name !== undefined) updateFields.first_name = first_name;
    if (last_name  !== undefined) updateFields.last_name  = last_name;
    if (email      !== undefined) updateFields.email      = email;
    if (phone      !== undefined) updateFields.phone      = phone;
    if (address    !== undefined) updateFields.address    = address;
    if (status     !== undefined) updateFields.status     = status;

    await Student.findByIdAndUpdate(req.params.id, updateFields);

    const fullName = `${first_name || existing.first_name} ${last_name || existing.last_name}`;
    AuditLog.create({
      tenant_id: req.tenant_id || null,
      user_id: req.user.id,
      user_role: req.user.role,
      action: 'UPDATE_STUDENT',
      entity_type: 'Student',
      entity_id: req.params.id,
      notes: `Updated student details for ${fullName} (${existing.student_number})`
    }).catch(() => {});

    res.json({ success: true, message: 'Student updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

// DELETE /api/students/:id (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    
    // Cleanup related records
    await Registration.deleteMany({ student_id: req.params.id });
    await Payment.deleteMany({ student_id: req.params.id });
    await Student.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'Student and related records deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete student' });
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
    await Payment.create({ tenant_id: req.tenant_id, 
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
