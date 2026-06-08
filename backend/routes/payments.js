const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Class = require('../models/Class');
const { authenticate } = require('../middleware/auth');

// GET /api/payments/total
router.get('/total', authenticate, async (req, res) => {
  try {
    const { program, startDate, endDate } = req.query;
    const match = { status: 'verified' };

    if (startDate && endDate) {
      match.payment_date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    if (program) {
      // Find students enrolled in this program
      const studentsInProgram = (await Class.find({ program }).select('students')).flatMap(c => c.students);
      match.student_id = { $in: studentsInProgram };
    }

    const result = await Payment.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: '$amount_paid' } } }
    ]);

    const total = result[0]?.total || 0;
    res.json({ success: true, data: { total } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to calculate payments total' });
  }
});

module.exports = router;
