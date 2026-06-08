const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId }, // Can refer to Admin, Teacher, or Student
  user_role: { type: String },
  action: { type: String, required: true },
  entity_type: { type: String },
  entity_id: { type: mongoose.Schema.Types.ObjectId },
  notes: { type: String }
}, {
  timestamps: { createdAt: 'timestamp', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
