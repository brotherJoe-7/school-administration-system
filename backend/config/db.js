const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import all models
const Admin = require('../models/Admin');
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

    // Check and create Admin if not exists
    const existingAdmin = await Admin.findOne({ email: 'admin@schooladmin.edu' });
    if (!existingAdmin) {
      console.log('Creating Admin user...');
      const adminHash = await bcrypt.hash('Admin@123', 12);
      await Admin.create({
        full_name: 'System Administrator',
        email: 'admin@schooladmin.edu',
        password_hash: adminHash,
        status: 'active'
      });
      createdAny = true;
    } else {
      console.log('✅ Admin user already exists');
    }

    // Check and create Teacher if not exists
    const existingTeacher = await Teacher.findOne({ email: 'i.koroma@schooladmin.edu' });
    if (!existingTeacher) {
      console.log('Creating Teacher user...');
      const teacherHash = await bcrypt.hash('Teacher@123', 12);
      const year = new Date().getFullYear();
      const teacherCount = await Teacher.countDocuments({
        created_at: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31T23:59:59.999Z`)
        }
      });
      const teacherNumber = `TCH${year}${String(teacherCount + 1).padStart(3, '0')}`;
      
      await Teacher.create({
        teacher_number: teacherNumber,
        first_name: 'Ibrahim',
        last_name: 'Koroma',
        email: 'i.koroma@schooladmin.edu',
        password_hash: teacherHash,
        department: 'Computer Science',
        specialization: 'Software Engineering',
        status: 'active'
      });
      createdAny = true;
    } else {
      console.log('✅ Teacher user already exists');
    }

    // Check and create Student if not exists
    const existingStudent = await Student.findOne({ email: 'a.sesay@student.schooladmin.edu' });
    if (!existingStudent) {
      console.log('Creating Student user...');
      const studentHash = await bcrypt.hash('Student@123', 12);
      const year = new Date().getFullYear();
      const studentCount = await Student.countDocuments({
        created_at: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31T23:59:59.999Z`)
        }
      });
      const studentNumber = `SAS${year}${String(studentCount + 1).padStart(4, '0')}`;
      
      const student = await Student.create({
        student_number: studentNumber,
        first_name: 'Aminata',
        last_name: 'Sesay',
        email: 'a.sesay@student.schooladmin.edu',
        password_hash: studentHash,
        gender: 'female',
        nationality: 'Sierra Leonean',
        consent_gdpr: true,
        status: 'active'
      });

      // Create registration for student
      await Registration.create({
        student_id: student._id,
        program: 'BIT',
        year_of_study: 1,
        status: 'approved'
      });
      createdAny = true;
    } else {
      // Check if password matches, if not update it
      const validPassword = await bcrypt.compare('Student@123', existingStudent.password_hash);
      if (!validPassword) {
        console.log('Updating Student password...');
        const studentHash = await bcrypt.hash('Student@123', 12);
        await Student.findByIdAndUpdate(existingStudent._id, { password_hash: studentHash });
        createdAny = true;
      } else {
        console.log('✅ Student user already exists');
      }
    }

    if (createdAny) {
      console.log('🎉 Demo users created successfully!');
    } else {
      console.log('✅ All demo users already exist');
    }
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
  }
}

module.exports = { connectDB, testConnection };
