const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Payroll = require('../models/Payroll');
const Transcript = require('../models/Transcript');
const Student = require('../models/Student');
const Class = require('../models/Class');
const AuditLog = require('../models/AuditLog');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/approvals/count
router.get('/count', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { program } = req.query;
    
    // Count pending registrations
    const regFilter = { status: 'pending' };
    if (program) regFilter.program = program;
    const registrations = await Registration.countDocuments(regFilter);

    // Count pending transcripts
    const transFilter = { status: 'pending' };
    if (program) {
      const studentIds = (await Registration.find({ program, status: 'approved' }).select('student_id')).map(r => r.student_id);
      transFilter.student_id = { $in: studentIds };
    }
    const transcripts = await Transcript.countDocuments(transFilter);

    // Count pending payrolls
    const payrollFilter = { status: 'pending' };
    if (program) {
      const teacherIds = await Class.find({ program }).distinct('teacher_id');
      payrollFilter.teacher_id = { $in: teacherIds };
    }
    const payroll = await Payroll.countDocuments(payrollFilter);

    const total = registrations + transcripts + payroll;
    
    res.json({ success: true, data: { count: total, breakdown: { registrations, transcripts, payroll } } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to count approvals' });
  }
});

// GET /api/approvals - get all pending items
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { type = 'all', status = 'pending', page = 1, limit = 50 } = req.query;
    const results = {};

    if (type === 'all' || type === 'registration') {
      const regs = await Registration.find({ status })
        .populate('student_id', 'first_name last_name student_number email phone')
        .sort({ submitted_at: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit));

      // Attach payment info for each student
      const Payment = require('../models/Payment');
      const regData = await Promise.all(regs.map(async r => {
        const student = r.student_id;
        const payment = await Payment.findOne({ student_id: student?._id }).sort({ created_at: -1 });
        return {
          ...r.toObject(),
          first_name: student?.first_name,
          last_name: student?.last_name,
          student_number: student?.student_number,
          email: student?.email,
          phone: student?.phone,
          amount_paid: payment?.amount_paid,
          amount_due: payment?.amount_due,
          payment_status: payment?.status
        };
      }));
      results.registrations = regData;
    }

    if (type === 'all' || type === 'payroll') {
      const payrolls = await Payroll.find({ status })
        .populate('teacher_id', 'first_name last_name teacher_number department')
        .sort({ created_at: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit));

      results.payroll = payrolls.map(p => ({
        ...p.toObject(),
        first_name: p.teacher_id?.first_name,
        last_name: p.teacher_id?.last_name,
        teacher_number: p.teacher_id?.teacher_number,
        department: p.teacher_id?.department
      }));
    }

    if (type === 'all' || type === 'transcript') {
      const transcripts = await Transcript.find({ status })
        .populate('student_id', 'first_name last_name student_number')
        .sort({ requested_at: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit));

      const transcriptData = await Promise.all(transcripts.map(async t => {
        const reg = await Registration.findOne({ student_id: t.student_id?._id, status: 'approved' });
        return {
          ...t.toObject(),
          first_name: t.student_id?.first_name,
          last_name: t.student_id?.last_name,
          student_number: t.student_id?.student_number,
          program: reg?.program
        };
      }));
      results.transcripts = transcriptData;
    }

    res.json({ success: true, data: results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch approval queue' });
  }
});

// POST /api/approvals/registration/:id/approve
router.post('/registration/:id/approve', authenticate, authorize('admin'), async (req, res) => {
  try {
    const reg = await Registration.findByIdAndUpdate(req.params.id, {
      status: 'approved',
      reviewed_by: req.user.id,
      reviewed_at: new Date()
    }, { new: true });

    if (reg) {
      // Activate the student
      await Student.findByIdAndUpdate(reg.student_id, { status: 'active' });
    }

    await AuditLog.create({
      user_id: req.user.id,
      user_role: 'admin',
      action: 'APPROVE_REGISTRATION',
      entity_type: 'Registration',
      entity_id: req.params.id
    }).catch(() => {});

    res.json({ success: true, message: 'Registration approved' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Approval failed' });
  }
});

// POST /api/approvals/registration/:id/reject
router.post('/registration/:id/reject', authenticate, authorize('admin'), async (req, res) => {
  const { reason } = req.body;
  try {
    await Registration.findByIdAndUpdate(req.params.id, {
      status: 'rejected',
      rejection_reason: reason,
      reviewed_by: req.user.id,
      reviewed_at: new Date()
    });

    await AuditLog.create({
      user_id: req.user.id,
      user_role: 'admin',
      action: 'REJECT_REGISTRATION',
      entity_type: 'Registration',
      entity_id: req.params.id,
      notes: reason
    }).catch(() => {});

    res.json({ success: true, message: 'Registration rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Rejection failed' });
  }
});

// POST /api/approvals/transcript/:id/approve
router.post('/transcript/:id/approve', authenticate, authorize('admin'), async (req, res) => {
  try {
    await Transcript.findByIdAndUpdate(req.params.id, {
      status: 'approved',
      approved_by: req.user.id,
      approved_at: new Date()
    });

    await AuditLog.create({
      user_id: req.user.id,
      user_role: 'admin',
      action: 'APPROVE_TRANSCRIPT',
      entity_type: 'Transcript',
      entity_id: req.params.id
    }).catch(() => {});

    res.json({ success: true, message: 'Transcript approved' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Approval failed' });
  }
});

// POST /api/approvals/transcript/:id/reject
router.post('/transcript/:id/reject', authenticate, authorize('admin'), async (req, res) => {
  const { reason } = req.body;
  try {
    await Transcript.findByIdAndUpdate(req.params.id, {
      status: 'rejected',
      rejection_reason: reason,
      approved_by: req.user.id,
      approved_at: new Date()
    });
    res.json({ success: true, message: 'Transcript rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Rejection failed' });
  }
});

// GET /api/approvals/audit-log
router.get('/audit-log', authenticate, authorize('admin'), async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit log' });
  }
});

module.exports = router;
