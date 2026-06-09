const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  amount_paid: { type: Number, required: true },
  amount_due: { type: Number, required: true },
  payment_date: { type: Date, required: true },
  payment_method: { type: String },
  reference: { type: String },
  semester: { type: String },
  status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  verified_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  verified_at: { type: Date }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for dashboard performance
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ payment_date: -1 });
PaymentSchema.index({ student_id: 1 });

module.exports = mongoose.model('Payment', PaymentSchema);
