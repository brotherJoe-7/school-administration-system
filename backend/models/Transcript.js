const mongoose = require('mongoose');

const TranscriptSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  approved_at: { type: Date },
  rejection_reason: { type: String }
}, {
  timestamps: { createdAt: 'requested_at', updatedAt: 'created_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('Transcript', TranscriptSchema);
