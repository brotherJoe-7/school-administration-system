const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  student_number: { type: String, required: true, unique: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  date_of_birth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
  phone: { type: String },
  address: { type: String },
  nationality: { type: String, default: 'Sierra Leonean' },
  emergency_contact_name: { type: String },
  emergency_contact_phone: { type: String },
  program: { type: String },
  year_of_study: { type: Number, default: 1 },
  consent_gdpr: { type: Boolean, default: false },
  reset_password_token: { type: String },
  reset_password_expires: { type: Date },
  status: { type: String, enum: ['pending', 'active', 'suspended', 'graduated'], default: 'pending' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for dashboard performance
StudentSchema.index({ status: 1 });
StudentSchema.index({ created_at: -1 });

module.exports = mongoose.model('Student', StudentSchema);
