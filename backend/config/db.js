const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import all models
const Admin = require('../models/Admin');
const Tenant = require('../models/Tenant');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Registration = require('../models/Registration');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const ReportCard = require('../models/ReportCard');
const Transcript = require('../models/Transcript');
const Payroll = require('../models/Payroll');
const AuditLog = require('../models/AuditLog');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/school_admin_db';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('MongoDB connected successfully');
    await seedDatabase();
  } catch (error) {
    console.error('');
    console.error('=== MongoDB Connection Failed ===');
    console.error('URI tried:', uri.replace(/:\/\/[^@]+@/, '://***@'));
    console.error('Error:', error.message);
    console.error('');
    console.error('Fix: Set MONGODB_URI in backend/.env to a valid MongoDB connection string.');
    console.error('Free option: https://www.mongodb.com/atlas  (create a free cluster in 2 minutes)');
    console.error('================================');
    console.error('');
    process.exit(1);
  }
};

const testConnection = async () => {
  await connectDB();
};

async function seedDatabase() {
  try {
    let createdAny = false;

    // Ensure a default tenant exists first (Admin schema requires tenant_id)
    let defaultTenant = await Tenant.findOne({ subdomain: 'default' });
    if (!defaultTenant) {
      defaultTenant = await Tenant.create({
        name: 'Default School',
        subdomain: 'default',
        admin_email: 'admin@schooladmin.edu',
        subscription_status: 'active',
        plan_type: 'enterprise',
      });
      console.log('✅ Default Tenant created');
    }

    // Check and create Admin if not exists
    const existingAdmin = await Admin.findOne({ email: 'admin@schooladmin.edu' });
    if (!existingAdmin) {
      console.log('Creating Admin user...');
      const adminHash = await bcrypt.hash('Admin123!', 12);
      await Admin.create({
        full_name: 'System Administrator',
        email: 'admin@schooladmin.edu',
        password_hash: adminHash,
        status: 'active',
        tenant_id: defaultTenant._id,
      });
      createdAny = true;
    } else {
      console.log('✅ Admin user already exists');
    }

    if (createdAny) {
      console.log('🎉 Default Admin created successfully! Password: Admin123!');
    } else {
      console.log('✅ Default Admin already exists');
    }
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
  }
}

module.exports = { connectDB, testConnection };
