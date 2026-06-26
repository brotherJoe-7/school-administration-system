const mongoose = require('mongoose');

const TenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subdomain: { type: String, required: true, unique: true },
  admin_email: { type: String, required: true },
  contact_number: { type: String },
  address: { type: String },
  subscription_status: { type: String, enum: ['active', 'trial', 'suspended', 'cancelled'], default: 'trial' },
  plan_type: { type: String, enum: ['basic', 'premium', 'enterprise'], default: 'basic' },
  billing_cycle: { type: String, enum: ['monthly', 'annually'], default: 'monthly' },
  custom_theme: {
    primary_color: { type: String, default: '#000000' },
    logo_url: { type: String }
  },
  id_prefix: { type: String, default: '90500' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('Tenant', TenantSchema);
