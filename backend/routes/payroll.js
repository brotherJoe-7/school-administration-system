const express = require('express');
const router = express.Router();
const Payroll = require('../models/Payroll');
const AuditLog = require('../models/AuditLog');
const { authenticate, authorize } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenantMiddleware');

// GET /api/payroll - list payroll records
router.get('/', authenticate, authorize('admin'), tenantMiddleware, async (req, res) => {
  try {
    const { month, status } = req.query;
    const filter = { tenant_id: req.tenant_id };

    if (status) filter.status = status;

    if (month) {
      // month format: YYYY-MM
      const [year, mon] = month.split('-').map(Number);
      filter.pay_period = {
        $gte: new Date(year, mon - 1, 1),
        $lte: new Date(year, mon, 0, 23, 59, 59)
      };
    }

    const records = await Payroll.find(filter)
      .populate('teacher_id', 'first_name last_name teacher_number department')
      .sort({ pay_period: -1 });

    const data = records.map(p => {
      const t = p.teacher_id;
      return {
        ...p.toObject(),
        first_name: t?.first_name,
        last_name: t?.last_name,
        teacher_number: t?.teacher_number,
        department: t?.department
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch payroll records' });
  }
});

// GET /api/payroll/my-payslips (teacher)
router.get('/my-payslips', authenticate, authorize('teacher'), tenantMiddleware, async (req, res) => {
  try {
    const payslips = await Payroll.find({ teacher_id: req.user.id, tenant_id: req.tenant_id }).sort({ pay_period: -1 });
    res.json({ success: true, data: payslips });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch payslips' });
  }
});

// POST /api/payroll - create payroll entry
router.post('/', authenticate, authorize('admin'), tenantMiddleware, async (req, res) => {
  const { teacher_id, salary_amount, allowances, deductions, pay_period } = req.body;

  if (!teacher_id || !salary_amount || !pay_period) {
    return res.status(400).json({ success: false, message: 'teacher_id, salary_amount, and pay_period are required' });
  }

  const net_pay = parseFloat(salary_amount) + parseFloat(allowances || 0) - parseFloat(deductions || 0);

  try {
    // Check for duplicate pay period for this teacher (same year-month)
    const periodDate = new Date(pay_period);
    const existing = await Payroll.findOne({
      teacher_id,
      tenant_id: req.tenant_id,
      pay_period: {
        $gte: new Date(periodDate.getFullYear(), periodDate.getMonth(), 1),
        $lte: new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 0, 23, 59, 59)
      }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Payroll already exists for this period' });
    }

    const newPayroll = await Payroll.create({
      tenant_id: req.tenant_id,
      teacher_id,
      salary_amount,
      allowances: allowances || 0,
      deductions: deductions || 0,
      net_pay,
      pay_period: periodDate,
      status: 'pending',
      created_by: req.user.id
    });

    res.status(201).json({ success: true, message: 'Payroll entry created', id: newPayroll._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create payroll entry' });
  }
});

// PUT /api/payroll/:id/approve
router.put('/:id/approve', authenticate, authorize('admin'), tenantMiddleware, async (req, res) => {
  try {
    await Payroll.findOneAndUpdate({ _id: req.params.id, tenant_id: req.tenant_id }, {
      status: 'approved',
      approved_by: req.user.id,
      approved_at: new Date()
    });
    await AuditLog.create({
      tenant_id: req.tenant_id,
      user_id: req.user.id,
      user_role: 'admin',
      action: 'APPROVE_PAYROLL',
      entity_type: 'Payroll',
      entity_id: req.params.id
    }).catch(() => {});
    res.json({ success: true, message: 'Payroll approved' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Approval failed' });
  }
});

// PUT /api/payroll/:id/reject
router.put('/:id/reject', authenticate, authorize('admin'), tenantMiddleware, async (req, res) => {
  const { reason } = req.body;
  try {
    await Payroll.findOneAndUpdate({ _id: req.params.id, tenant_id: req.tenant_id }, {
      status: 'rejected',
      rejection_reason: reason,
      approved_by: req.user.id,
      approved_at: new Date()
    });
    res.json({ success: true, message: 'Payroll rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Rejection failed' });
  }
});

// PUT /api/payroll/:id - update pending payroll
router.put('/:id', authenticate, authorize('admin'), tenantMiddleware, async (req, res) => {
  const { salary_amount, allowances, deductions } = req.body;
  const net_pay = parseFloat(salary_amount) + parseFloat(allowances || 0) - parseFloat(deductions || 0);
  try {
    await Payroll.findOneAndUpdate(
      { _id: req.params.id, status: 'pending', tenant_id: req.tenant_id },
      { salary_amount, allowances: allowances || 0, deductions: deductions || 0, net_pay }
    );
    res.json({ success: true, message: 'Payroll updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

module.exports = router;
