const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  national_id: { type: String, index: true, sparse: true },
  global_tracking_id: { type: String, index: true },
  student_number: { type: String, required: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true },
  password_hash: { type: String, required: true },
  date_of_birth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
  profile_picture: { type: String },
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
  status: { type: String, enum: ['pending', 'active', 'suspended', 'graduated', 'transferred'], default: 'pending' },
  transfer_destination: { type: String }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for dashboard performance
StudentSchema.index({ status: 1 });
StudentSchema.index({ created_at: -1 });

// Tenant-specific uniqueness
StudentSchema.index({ tenant_id: 1, student_number: 1 }, { unique: true });
StudentSchema.index({ tenant_id: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('Student', StudentSchema);
