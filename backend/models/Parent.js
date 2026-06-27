const mongoose = require('mongoose');

const ParentSchema = new mongoose.Schema({
  tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password_hash: { type: String, required: true },
  student_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  force_password_change: { type: Boolean, default: true }, // Prompt parent to change default password
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Parent', ParentSchema);
