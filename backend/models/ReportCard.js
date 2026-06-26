const mongoose = require('mongoose');

const ReportCardSchema = new mongoose.Schema({
  tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  class_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  semester: { type: String, required: true },
  grade: { type: String, required: true },
  score: { type: Number, required: true },
  comments: { type: String },
  entered_by: { type: mongoose.Schema.Types.ObjectId } // references Admin or Teacher
}, {
  timestamps: { createdAt: 'entered_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound unique index
ReportCardSchema.index({ student_id: 1, class_id: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('ReportCard', ReportCardSchema);
