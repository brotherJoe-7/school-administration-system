const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
  tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  class_name: { type: String, required: true },
  class_code: { type: String, required: true, unique: true },
  teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  program: { type: String },
  credit_hours: { type: Number, default: 3 },
  semester: { type: String },
  schedule: { type: String },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for dashboard performance
ClassSchema.index({ program: 1 });
ClassSchema.index({ teacher_id: 1 });

module.exports = mongoose.model('Class', ClassSchema);
