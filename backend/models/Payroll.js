const mongoose = require('mongoose');

const PayrollSchema = new mongoose.Schema({
  tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: false },
  teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  salary_amount: { type: Number, required: true },
  allowances: { type: Number, default: 0.00 },
  deductions: { type: Number, default: 0.00 },
  net_pay: { type: Number, required: true },
  pay_period: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'disbursed'], default: 'pending' },
  rejection_reason: { type: String },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  approved_at: { type: Date },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('Payroll', PayrollSchema);
