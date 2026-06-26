const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({
  tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  program: { type: String, required: true },
  year_of_study: { type: Number, default: 1 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  reviewed_at: { type: Date },
  rejection_reason: { type: String }
}, {
  timestamps: { createdAt: 'submitted_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for dashboard performance
RegistrationSchema.index({ status: 1 });
RegistrationSchema.index({ program: 1 });
RegistrationSchema.index({ student_id: 1 });

module.exports = mongoose.model('Registration', RegistrationSchema);
