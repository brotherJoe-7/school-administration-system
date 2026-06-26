const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  course_name: { type: String, required: true },
  course_code: { type: String, required: true },
  program: { type: String, required: true },
  faculty: { type: String },
  credit_hours: { type: Number, default: 3 },
  teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Ensure course codes are unique per tenant
CourseSchema.index({ tenant_id: 1, course_code: 1 }, { unique: true });

module.exports = mongoose.model('Course', CourseSchema);
