const mongoose = require('mongoose');

const ReportCardSchema = new mongoose.Schema({
  tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  class_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  semester: { type: String, required: true },
  
  // Sierra Leone Context Differentiation
  school_level: { type: String, enum: ['primary', 'secondary', 'senior_secondary', 'university'], default: 'secondary' },
  
  // Primary / Secondary Fields
  continuous_assessment_score: { type: Number }, // CA Score
  exam_score: { type: Number }, // Final Exam Score
  total_score: { type: Number }, // CA + Exam
  grade: { type: String }, // Letter grade e.g., A1, B2, C4, F9
  position: { type: Number }, // Class ranking position e.g. 1st, 2nd, 3rd
  
  // University Fields
  credits: { type: Number }, // Course credit hours
  grade_point: { type: Number }, // GPA equivalent points e.g. 4.0, 3.0
  
  comments: { type: String },
  entered_by: { type: mongoose.Schema.Types.ObjectId } // references Admin or Teacher
}, {
  timestamps: { createdAt: 'entered_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound unique index for preventing duplicates
ReportCardSchema.index({ student_id: 1, class_id: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('ReportCard', ReportCardSchema);
