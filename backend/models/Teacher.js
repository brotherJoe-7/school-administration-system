const mongoose = require('mongoose');

const TeacherSchema = new mongoose.Schema({
  teacher_number: { type: String, required: true, unique: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  phone: { type: String },
  department: { type: String },
  specialization: { type: String },
  status: { type: String, enum: ['active', 'inactive', 'on_leave'], default: 'active' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for dashboard performance
TeacherSchema.index({ status: 1 });
TeacherSchema.index({ created_at: -1 });

module.exports = mongoose.model('Teacher', TeacherSchema);
