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
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      console.log('Database already seeded');
      return;
    }

    console.log('Seeding MongoDB database with sample data...');

    // 1. Seed Admins
    // Passwords hashed dynamically: Admin@123, Teacher@123, Student@123
    const adminHash = await bcrypt.hash('Admin@123', 12);
    const teacherHash = await bcrypt.hash('Teacher@123', 12);
    const studentHash = await bcrypt.hash('Student@123', 12);

    const admin = await Admin.create({
      full_name: 'System Administrator',
      email: 'admin@schooladmin.edu',
      password_hash: adminHash,
      status: 'active'
    });

    // 2. Seed Teachers
    const teacherData = [
      { teacher_number: 'TCH2024001', first_name: 'Ibrahim', last_name: 'Koroma', email: 'i.koroma@schooladmin.edu', password_hash: teacherHash, phone: '+23276123456', department: 'Computing', specialization: 'Software Engineering', status: 'active' },
      { teacher_number: 'TCH2024002', first_name: 'Fatima', last_name: 'Bangura', email: 'f.bangura@schooladmin.edu', password_hash: teacherHash, phone: '+23276234567', department: 'Computing', specialization: 'Database Systems', status: 'active' },
      { teacher_number: 'TCH2024003', first_name: 'Mohamed', last_name: 'Conteh', email: 'm.conteh@schooladmin.edu', password_hash: teacherHash, phone: '+23276345678', department: 'Business', specialization: 'Management Information Systems', status: 'active' },
      { teacher_number: 'TCH2024004', first_name: 'Aminata', last_name: 'Kamara', email: 'a.kamara@schooladmin.edu', password_hash: teacherHash, phone: '+23276456789', department: 'Science', specialization: 'Data Analytics', status: 'active' }
    ];
    const teachers = await Teacher.insertMany(teacherData);

    // 3. Seed Students
    const studentData = [
      { student_number: 'SAS20240001', first_name: 'Abdul', last_name: 'Sesay', email: 'a.sesay@student.schooladmin.edu', password_hash: studentHash, date_of_birth: new Date('2002-03-15'), gender: 'male', phone: '+23278123456', nationality: 'Sierra Leonean', consent_gdpr: true, status: 'active' },
      { student_number: 'SAS20240002', first_name: 'Mariama', last_name: 'Turay', email: 'm.turay@student.schooladmin.edu', password_hash: studentHash, date_of_birth: new Date('2001-07-22'), gender: 'female', phone: '+23278234567', nationality: 'Sierra Leonean', consent_gdpr: true, status: 'active' },
      { student_number: 'SAS20240003', first_name: 'Osman', last_name: 'Jalloh', email: 'o.jalloh@student.schooladmin.edu', password_hash: studentHash, date_of_birth: new Date('2003-01-10'), gender: 'male', phone: '+23278345678', nationality: 'Sierra Leonean', consent_gdpr: true, status: 'active' },
      { student_number: 'SAS20240004', first_name: 'Adama', last_name: 'Fofanah', email: 'f.fofanah@student.schooladmin.edu', password_hash: studentHash, date_of_birth: new Date('2002-11-05'), gender: 'male', phone: '+23278456789', nationality: 'Sierra Leonean', consent_gdpr: true, status: 'active' },
      { student_number: 'SAS20240005', first_name: 'Isatu', last_name: 'Mansaray', email: 'i.mansaray@student.schooladmin.edu', password_hash: studentHash, date_of_birth: new Date('2001-09-18'), gender: 'female', phone: '+23278567890', nationality: 'Sierra Leonean', consent_gdpr: true, status: 'active' },
      { student_number: 'SAS20240006', first_name: 'Samuel', last_name: 'Kanu', email: 's.kanu@student.schooladmin.edu', password_hash: studentHash, date_of_birth: new Date('2002-04-30'), gender: 'male', phone: '+23278678901', nationality: 'Sierra Leonean', consent_gdpr: true, status: 'active' },
      { student_number: 'SAS20240007', first_name: 'Kadiatu',  'last_name': 'Diallo', 'email': 'k.diallo@student.schooladmin.edu', password_hash: studentHash, date_of_birth: new Date('2003-06-14'), gender: 'female', phone: '+23278789012', nationality: 'Sierra Leonean', consent_gdpr: true, status: 'active' },
      { student_number: 'SAS20240008', first_name: 'Foday',    'last_name': 'Bah',    'email': 'f.bah@student.schooladmin.edu',    password_hash: studentHash, date_of_birth: new Date('2001-12-01'), gender: 'male', phone: '+23278890123', nationality: 'Sierra Leonean', consent_gdpr: true, status: 'pending' }
    ];
    const students = await Student.insertMany(studentData);

    // 4. Seed Classes
    const classData = [
      { class_name: 'Introduction to Programming', class_code: 'CS101', teacher_id: teachers[0]._id, program: 'BIT', credit_hours: 3, semester: '2024-Sem1', schedule: 'Mon/Wed 08:00-10:00', students: [students[0]._id, students[2]._id, students[5]._id] },
      { class_name: 'Database Management Systems', class_code: 'CS201', teacher_id: teachers[1]._id, program: 'BIT', credit_hours: 3, semester: '2024-Sem1', schedule: 'Tue/Thu 10:00-12:00', students: [students[0]._id, students[4]._id] },
      { class_name: 'Software Engineering Fundamentals', class_code: 'CS301', teacher_id: teachers[0]._id, program: 'BSEM', credit_hours: 3, semester: '2024-Sem1', schedule: 'Mon/Wed 14:00-16:00', students: [students[2]._id] },
      { class_name: 'Business Information Systems', class_code: 'BI101', teacher_id: teachers[2]._id, program: 'BBIT', credit_hours: 3, semester: '2024-Sem1', schedule: 'Tue/Thu 14:00-16:00', students: [students[1]._id, students[3]._id, students[6]._id] },
      { class_name: 'Data Analytics & Visualization', class_code: 'DA101', teacher_id: teachers[3]._id, program: 'DAT', credit_hours: 3, semester: '2024-Sem1', schedule: 'Fri 08:00-12:00', students: [students[4]._id] },
      { class_name: 'ICT Project Management', class_code: 'IT301', teacher_id: teachers[2]._id, program: 'BICT', credit_hours: 3, semester: '2024-Sem1', schedule: 'Mon 14:00-18:00', students: [students[3]._id] },
      { class_name: 'Computer Networks', class_code: 'CS401', teacher_id: teachers[0]._id, program: 'BIT', credit_hours: 3, semester: '2024-Sem2', schedule: 'Mon/Wed 08:00-10:00', students: [students[0]._id, students[5]._id] },
      { class_name: 'Advanced Database', class_code: 'CS501', teacher_id: teachers[1]._id, program: 'BBIT', credit_hours: 3, semester: '2024-Sem2', schedule: 'Tue/Thu 10:00-12:00', students: [students[1]._id, students[6]._id] }
    ];
    const classes = await Class.insertMany(classData);

    // 5. Seed Registrations
    const registrationData = [
      { student_id: students[0]._id, program: 'BIT', year_of_study: 1, status: 'approved', reviewed_by: admin._id, reviewed_at: new Date('2024-01-10T09:00:00Z'), submitted_at: new Date('2024-01-08T10:00:00Z') },
      { student_id: students[1]._id, program: 'BBIT', year_of_study: 1, status: 'approved', reviewed_by: admin._id, reviewed_at: new Date('2024-01-10T09:15:00Z'), submitted_at: new Date('2024-01-08T11:00:00Z') },
      { student_id: students[2]._id, program: 'BSEM', year_of_study: 2, status: 'approved', reviewed_by: admin._id, reviewed_at: new Date('2024-01-10T09:30:00Z'), submitted_at: new Date('2024-01-08T12:00:00Z') },
      { student_id: students[3]._id, program: 'BICT', year_of_study: 1, status: 'approved', reviewed_by: admin._id, reviewed_at: new Date('2024-01-10T09:45:00Z'), submitted_at: new Date('2024-01-08T13:00:00Z') },
      { student_id: students[4]._id, program: 'DAT', year_of_study: 1, status: 'approved', reviewed_by: admin._id, reviewed_at: new Date('2024-01-10T10:00:00Z'), submitted_at: new Date('2024-01-08T14:00:00Z') },
      { student_id: students[5]._id, program: 'BIT', year_of_study: 2, status: 'approved', reviewed_by: admin._id, reviewed_at: new Date('2024-01-10T10:15:00Z'), submitted_at: new Date('2024-01-08T15:00:00Z') },
      { student_id: students[6]._id, program: 'BBIT', year_of_study: 2, status: 'approved', reviewed_by: admin._id, reviewed_at: new Date('2024-01-10T10:30:00Z'), submitted_at: new Date('2024-01-08T16:00:00Z') },
      { student_id: students[7]._id, program: 'BSEM', year_of_study: 1, status: 'pending', submitted_at: new Date('2024-06-01T10:00:00Z') }
    ];
    await Registration.insertMany(registrationData);

    // 6. Seed Payments
    const paymentData = [
      { student_id: students[0]._id, amount_paid: 1500000, amount_due: 1500000, payment_date: new Date('2024-01-15'), payment_method: 'Bank Transfer', reference: 'TXN-001-2024', semester: '2024-Sem1', status: 'verified', verified_by: admin._id, verified_at: new Date('2024-01-16T10:00:00Z') },
      { student_id: students[1]._id, amount_paid: 1500000, amount_due: 1500000, payment_date: new Date('2024-01-16'), payment_method: 'Mobile Money', reference: 'TXN-002-2024', semester: '2024-Sem1', status: 'verified', verified_by: admin._id, verified_at: new Date('2024-01-17T10:00:00Z') },
      { student_id: students[2]._id, amount_paid: 1500000, amount_due: 1500000, payment_date: new Date('2024-01-17'), payment_method: 'Bank Transfer', reference: 'TXN-003-2024', semester: '2024-Sem1', status: 'verified', verified_by: admin._id, verified_at: new Date('2024-01-18T10:00:00Z') },
      { student_id: students[3]._id, amount_paid: 1200000, amount_due: 1500000, payment_date: new Date('2024-01-18'), payment_method: 'Cash', reference: 'TXN-004-2024', semester: '2024-Sem1', status: 'verified', verified_by: admin._id, verified_at: new Date('2024-01-19T10:00:00Z') },
      { student_id: students[4]._id, amount_paid: 1500000, amount_due: 1500000, payment_date: new Date('2024-01-20'), payment_method: 'Mobile Money', reference: 'TXN-005-2024', semester: '2024-Sem1', status: 'verified', verified_by: admin._id, verified_at: new Date('2024-01-21T10:00:00Z') },
      { student_id: students[5]._id, amount_paid: 1500000, amount_due: 1500000, payment_date: new Date('2024-01-22'), payment_method: 'Bank Transfer', reference: 'TXN-006-2024', semester: '2024-Sem1', status: 'verified', verified_by: admin._id, verified_at: new Date('2024-01-23T10:00:00Z') },
      { student_id: students[6]._id, amount_paid: 750000, amount_due: 1500000, payment_date: new Date('2024-01-25'), payment_method: 'Mobile Money', reference: 'TXN-007-2024', semester: '2024-Sem1', status: 'pending' }
    ];
    await Payment.insertMany(paymentData);

    // 7. Seed Attendance (sample records)
    const attendanceData = [
      { student_id: students[0]._id, class_id: classes[0]._id, date: new Date('2024-02-05'), status: 'present', recorded_by: admin._id },
      { student_id: students[0]._id, class_id: classes[0]._id, date: new Date('2024-02-07'), status: 'present', recorded_by: admin._id },
      { student_id: students[0]._id, class_id: classes[0]._id, date: new Date('2024-02-12'), status: 'absent', recorded_by: admin._id },

      { student_id: students[1]._id, class_id: classes[3]._id, date: new Date('2024-02-05'), status: 'present', recorded_by: admin._id },
      { student_id: students[1]._id, class_id: classes[3]._id, date: new Date('2024-02-07'), status: 'present', recorded_by: admin._id },
      { student_id: students[1]._id, class_id: classes[3]._id, date: new Date('2024-02-12'), status: 'present', recorded_by: admin._id },

      { student_id: students[2]._id, class_id: classes[2]._id, date: new Date('2024-02-05'), status: 'present', recorded_by: admin._id },
      { student_id: students[2]._id, class_id: classes[2]._id, date: new Date('2024-02-07'), status: 'absent', recorded_by: admin._id },
      { student_id: students[2]._id, class_id: classes[2]._id, date: new Date('2024-02-12'), status: 'present', recorded_by: admin._id },

      { student_id: students[3]._id, class_id: classes[5]._id, date: new Date('2024-02-05'), status: 'present', recorded_by: admin._id },
      { student_id: students[3]._id, class_id: classes[5]._id, date: new Date('2024-02-07'), status: 'present', recorded_by: admin._id },
      { student_id: students[3]._id, class_id: classes[5]._id, date: new Date('2024-02-12'), status: 'present', recorded_by: admin._id },

      { student_id: students[4]._id, class_id: classes[4]._id, date: new Date('2024-02-05'), status: 'absent', recorded_by: admin._id },
      { student_id: students[4]._id, class_id: classes[4]._id, date: new Date('2024-02-07'), status: 'present', recorded_by: admin._id },
      { student_id: students[4]._id, class_id: classes[4]._id, date: new Date('2024-02-12'), status: 'present', recorded_by: admin._id },

      { student_id: students[5]._id, class_id: classes[0]._id, date: new Date('2024-02-05'), status: 'present', recorded_by: admin._id },
      { student_id: students[5]._id, class_id: classes[0]._id, date: new Date('2024-02-07'), status: 'present', recorded_by: admin._id },
      { student_id: students[5]._id, class_id: classes[0]._id, date: new Date('2024-02-12'), status: 'late', recorded_by: admin._id }
    ];
    await Attendance.insertMany(attendanceData);

    // 8. Seed ReportCards
    const reportCardData = [
      { student_id: students[0]._id, class_id: classes[0]._id, semester: '2024-Sem1', grade: 'A', score: 92.5, comments: 'Excellent work in programming fundamentals', entered_by: admin._id },
      { student_id: students[0]._id, class_id: classes[1]._id, semester: '2024-Sem1', grade: 'B+', score: 87.0, comments: 'Good understanding of database concepts', entered_by: admin._id },
      { student_id: students[1]._id, class_id: classes[3]._id, semester: '2024-Sem1', grade: 'A-', score: 90.0, comments: 'Strong analytical skills demonstrated', entered_by: admin._id },
      { student_id: students[2]._id, class_id: classes[2]._id, semester: '2024-Sem1', grade: 'B', score: 83.5, comments: 'Good progress in software engineering', entered_by: admin._id },
      { student_id: students[2]._id, class_id: classes[0]._id, semester: '2024-Sem1', grade: 'A', score: 94.0, comments: 'Outstanding performance', entered_by: admin._id },
      { student_id: students[3]._id, class_id: classes[5]._id, semester: '2024-Sem1', grade: 'B-', score: 76.0, comments: 'Needs improvement in project planning', entered_by: admin._id },
      { student_id: students[4]._id, class_id: classes[4]._id, semester: '2024-Sem1', grade: 'A', score: 95.5, comments: 'Exceptional data analysis skills', entered_by: admin._id },
      { student_id: students[5]._id, class_id: classes[0]._id, semester: '2024-Sem1', grade: 'C+', score: 72.5, comments: 'Adequate understanding; more practice needed', entered_by: admin._id }
    ];
    await ReportCard.insertMany(reportCardData);

    // 9. Seed Payroll
    const payrollData = [
      { teacher_id: teachers[0]._id, salary_amount: 5000000, allowances: 500000, deductions: 350000, net_pay: 5150000, pay_period: new Date('2024-05-01'), status: 'approved', approved_by: admin._id, approved_at: new Date('2024-05-28T10:00:00Z'), created_by: admin._id },
      { teacher_id: teachers[1]._id, salary_amount: 4500000, allowances: 400000, deductions: 315000, net_pay: 4585000, pay_period: new Date('2024-05-01'), status: 'approved', approved_by: admin._id, approved_at: new Date('2024-05-28T10:05:00Z'), created_by: admin._id },
      { teacher_id: teachers[2]._id, salary_amount: 4800000, allowances: 450000, deductions: 336000, net_pay: 4914000, pay_period: new Date('2024-05-01'), status: 'approved', approved_by: admin._id, approved_at: new Date('2024-05-28T10:10:00Z'), created_by: admin._id },
      { teacher_id: teachers[3]._id, salary_amount: 4200000, allowances: 380000, deductions: 294000, net_pay: 4286000, pay_period: new Date('2024-05-01'), status: 'approved', approved_by: admin._id, approved_at: new Date('2024-05-28T10:15:00Z'), created_by: admin._id },
      { teacher_id: teachers[0]._id, salary_amount: 5000000, allowances: 500000, deductions: 350000, net_pay: 5150000, pay_period: new Date('2024-06-01'), status: 'pending', created_by: admin._id },
      { teacher_id: teachers[1]._id, salary_amount: 4500000, allowances: 400000, deductions: 315000, net_pay: 4585000, pay_period: new Date('2024-06-01'), status: 'pending', created_by: admin._id }
    ];
    await Payroll.insertMany(payrollData);

    // 10. Seed Audit Logs
    const auditLogData = [
      { user_id: admin._id, user_role: 'admin', action: 'APPROVE_REGISTRATION', notes: 'Abdul Sesay - BIT Year 1' },
      { user_id: admin._id, user_role: 'admin', action: 'APPROVE_REGISTRATION', notes: 'Mariama Turay - BBIT Year 1' },
      { user_id: admin._id, user_role: 'admin', action: 'APPROVE_PAYROLL', notes: 'May 2024 payroll - Ibrahim Koroma' }
    ];
    await AuditLog.insertMany(auditLogData);

    console.log('🎉 MongoDB database seeded successfully!');
  } catch (error) {
    console.error('❌ Failed to seed database:', error);
  }
}

module.exports = { connectDB, testConnection };
