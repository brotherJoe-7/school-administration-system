const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  class_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent', 'late', 'excused'], required: true },
  recorded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' } // could be Admin or Teacher id
}, {
  timestamps: { createdAt: 'recorded_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound unique index
AttendanceSchema.index({ student_id: 1, class_id: 1, date: 1 }, { unique: true });

// Indexes for dashboard performance
AttendanceSchema.index({ date: -1 });
AttendanceSchema.index({ status: 1 });
AttendanceSchema.index({ class_id: 1 });

module.exports = mongoose.model('Attendance', AttendanceSchema);
