/**
 * DEMO DATA SEEDER — School Administration System
 * Run: node seed_demo.js
 *
 * Seeds: 4 Teachers, 20 Students, 10 Classes, Payments (5 months),
 *        Payroll entries (5 months), Attendance (last 30 days)
 * Safe to re-run — clears old demo data first.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Admin    = require('./models/Admin');
const Teacher  = require('./models/Teacher');
const Student  = require('./models/Student');
const Class    = require('./models/Class');
const Payment  = require('./models/Payment');
const Payroll  = require('./models/Payroll');
const Attendance = require('./models/Attendance');
const ReportCard = require('./models/ReportCard');

const PROGRAMS = {
  DIT:  'Diploma in Information Technology',
  BIT:  'B.Sc. (Hons) Information Technology',
  BBIT: 'B.Sc. (Hons) Business Information Technology',
  BSEM: 'B.Sc. (Hons) Software Engineering with Multimedia',
  BICT: 'B.Sc. (Hons) Information and Communication Technology',
};

// ──────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────
function randomPast(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
  return d;
}

function monthStart(monthsBack) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - monthsBack);
  d.setHours(0, 0, 0, 0);
  return d;
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ──────────────────────────────────────────
// SEED DATA DEFINITIONS
// ──────────────────────────────────────────
const TEACHER_DATA = [
  { first_name: 'Emmanuel', last_name: 'Conteh',   email: 'e.conteh@school.edu',   department: 'Computer Science',  specialization: 'Programming & Databases', teacher_number: 'TCH-001' },
  { first_name: 'Aminata',  last_name: 'Koroma',   email: 'a.koroma@school.edu',   department: 'Information Technology', specialization: 'Networking & Security', teacher_number: 'TCH-002' },
  { first_name: 'Ibrahim',  last_name: 'Bangura',  email: 'i.bangura@school.edu',  department: 'Business IT',       specialization: 'MIS & ERP Systems',       teacher_number: 'TCH-003' },
  { first_name: 'Fatmata',  last_name: 'Sesay',    email: 'f.sesay@school.edu',    department: 'Software Engineering', specialization: 'Web & Mobile Dev',     teacher_number: 'TCH-004' },
];

const STUDENT_DATA = [
  { first_name: 'Mohamed',    last_name: 'Kamara',    email: 'mk001@student.edu', program: PROGRAMS.DIT,  year_of_study: 1 },
  { first_name: 'Isata',      last_name: 'Turay',     email: 'it002@student.edu', program: PROGRAMS.DIT,  year_of_study: 1 },
  { first_name: 'Samuel',     last_name: 'Bangura',   email: 'sb003@student.edu', program: PROGRAMS.DIT,  year_of_study: 2 },
  { first_name: 'Mariama',    last_name: 'Conteh',    email: 'mc004@student.edu', program: PROGRAMS.DIT,  year_of_study: 2 },
  { first_name: 'Alhaji',     last_name: 'Sesay',     email: 'as005@student.edu', program: PROGRAMS.BIT,  year_of_study: 1 },
  { first_name: 'Kadiatu',    last_name: 'Koroma',    email: 'kk006@student.edu', program: PROGRAMS.BIT,  year_of_study: 1 },
  { first_name: 'David',      last_name: 'Mansaray',  email: 'dm007@student.edu', program: PROGRAMS.BIT,  year_of_study: 2 },
  { first_name: 'Hawa',       last_name: 'Bah',       email: 'hb008@student.edu', program: PROGRAMS.BIT,  year_of_study: 2 },
  { first_name: 'John',       last_name: 'Kallon',    email: 'jk009@student.edu', program: PROGRAMS.BBIT, year_of_study: 1 },
  { first_name: 'Adama',      last_name: 'Kargbo',    email: 'ak010@student.edu', program: PROGRAMS.BBIT, year_of_study: 1 },
  { first_name: 'Zainab',     last_name: 'Fofanah',   email: 'zf011@student.edu', program: PROGRAMS.BBIT, year_of_study: 2 },
  { first_name: 'Tamba',      last_name: 'Lahai',     email: 'tl012@student.edu', program: PROGRAMS.BBIT, year_of_study: 2 },
  { first_name: 'Francis',    last_name: 'Gborie',    email: 'fg013@student.edu', program: PROGRAMS.BSEM, year_of_study: 1 },
  { first_name: 'Memunatu',   last_name: 'Koroma',    email: 'mko014@student.edu',program: PROGRAMS.BSEM, year_of_study: 1 },
  { first_name: 'Patrick',    last_name: 'Sesay',     email: 'ps015@student.edu', program: PROGRAMS.BSEM, year_of_study: 2 },
  { first_name: 'Sia',        last_name: 'Kanu',      email: 'sk016@student.edu', program: PROGRAMS.BSEM, year_of_study: 2 },
  { first_name: 'Abdul',      last_name: 'Bangura',   email: 'ab017@student.edu', program: PROGRAMS.BICT, year_of_study: 1 },
  { first_name: 'Christiana', last_name: 'Williams',  email: 'cw018@student.edu', program: PROGRAMS.BICT, year_of_study: 1 },
  { first_name: 'Lansana',    last_name: 'Kamara',    email: 'lk019@student.edu', program: PROGRAMS.BICT, year_of_study: 2 },
  { first_name: 'Binta',      last_name: 'Turay',     email: 'bt020@student.edu', program: PROGRAMS.BICT, year_of_study: 2 },
];

const CLASS_DATA = [
  { class_name: 'Programming Logic & Design',  class_code: 'DIT-101', program: PROGRAMS.DIT,  semester: 'Year 1, Semester 1', schedule: 'Monday 08:00–10:00', credit_hours: 3, teacherIdx: 0 },
  { class_name: 'Structured Programming',      class_code: 'DIT-102', program: PROGRAMS.DIT,  semester: 'Year 1, Semester 2', schedule: 'Tuesday 10:00–12:00', credit_hours: 3, teacherIdx: 0 },
  { class_name: 'Database Systems',            class_code: 'DIT-201', program: PROGRAMS.DIT,  semester: 'Year 2, Semester 1', schedule: 'Wednesday 08:00–10:00', credit_hours: 3, teacherIdx: 0 },
  { class_name: 'Web Design Principles',       class_code: 'BIT-101', program: PROGRAMS.BIT,  semester: 'Year 1, Semester 1', schedule: 'Monday 10:00–12:00', credit_hours: 3, teacherIdx: 3 },
  { class_name: 'OOP Methods 1',               class_code: 'BIT-102', program: PROGRAMS.BIT,  semester: 'Year 1, Semester 2', schedule: 'Thursday 08:00–10:00', credit_hours: 3, teacherIdx: 3 },
  { class_name: 'MIS',                         class_code: 'BBIT-101', program: PROGRAMS.BBIT, semester: 'Year 1, Semester 1', schedule: 'Friday 08:00–10:00',  credit_hours: 3, teacherIdx: 2 },
  { class_name: 'Networking Administration',   class_code: 'BBIT-102', program: PROGRAMS.BBIT, semester: 'Year 1, Semester 2', schedule: 'Tuesday 08:00–10:00', credit_hours: 3, teacherIdx: 1 },
  { class_name: 'Event-Driven Programming',    class_code: 'BSEM-101', program: PROGRAMS.BSEM, semester: 'Year 1, Semester 1', schedule: 'Wednesday 10:00–12:00', credit_hours: 3, teacherIdx: 3 },
  { class_name: 'Mobile App Development',      class_code: 'BSEM-102', program: PROGRAMS.BSEM, semester: 'Year 1, Semester 2', schedule: 'Thursday 10:00–12:00', credit_hours: 3, teacherIdx: 3 },
  { class_name: 'Cybersecurity Introduction',  class_code: 'BICT-101', program: PROGRAMS.BICT, semester: 'Year 1, Semester 1', schedule: 'Friday 10:00–12:00',  credit_hours: 3, teacherIdx: 1 },
];

// How many students from the matching-program pool to enroll per class
const ENROLL_PER_CLASS = 4;

// ──────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────
async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅  Connected to MongoDB');

  const admin = await Admin.findOne({});
  if (!admin) { console.error('❌  No admin found — run seed_admin first'); process.exit(1); }
  const adminId = admin._id;

  // ── Wipe old demo data ──
  console.log('🗑   Clearing old demo data...');
  await Teacher.deleteMany({});
  await Student.deleteMany({});
  await Class.deleteMany({});
  await Payment.deleteMany({});
  await Payroll.deleteMany({});
  await Attendance.deleteMany({});
  console.log('    Done clearing.');

  // ── Teachers ──
  console.log('👩‍🏫  Seeding teachers...');
  const hashedPwd = await bcrypt.hash('Teacher123!', 12);
  const teachers = await Teacher.insertMany(
    TEACHER_DATA.map(t => ({ ...t, password_hash: hashedPwd, status: 'active' }))
  );
  console.log(`    ${teachers.length} teachers created.`);

  // ── Students ──
  console.log('🎓  Seeding students...');
  const stuHash = await bcrypt.hash('Student123!', 12);
  let stuNumber = 905000001;
  const students = await Student.insertMany(
    STUDENT_DATA.map(s => ({
      ...s,
      student_number: String(stuNumber++),
      password_hash: stuHash,
      status: 'active',
      consent_gdpr: true,
      gender: pick(['male','female']),
      nationality: 'Sierra Leonean',
    }))
  );
  console.log(`    ${students.length} students created.`);

  // ── Classes (with enrollment) ──
  console.log('📚  Seeding classes & enrolling students...');
  const classes = [];
  for (const cd of CLASS_DATA) {
    // Pick students who belong to this program
    const pool = students.filter(s => s.program === cd.program);
    const enrolled = pool.slice(0, ENROLL_PER_CLASS).map(s => s._id);

    const cls = await Class.create({
      class_name:   cd.class_name,
      class_code:   cd.class_code,
      program:      cd.program,
      semester:     cd.semester,
      schedule:     cd.schedule,
      credit_hours: cd.credit_hours,
      teacher_id:   teachers[cd.teacherIdx]._id,
      students:     enrolled,
    });
    classes.push({ cls, enrolled });
  }
  console.log(`    ${classes.length} classes created.`);

  // ── Payments (5 months, Jan–May 2025) ──
  console.log('💳  Seeding student payments...');
  const PAYMENT_MONTHS = [5, 4, 3, 2, 1, 0]; // months back from today
  const TUITION_FEE = 2500; // New Leones (NLe)
  const paymentDocs = [];
  for (const student of students) {
    for (const mBack of PAYMENT_MONTHS) {
      const paidFull = Math.random() > 0.2; // 80% pay in full
      const amount_paid = paidFull ? TUITION_FEE : Math.round(TUITION_FEE * (0.4 + Math.random() * 0.4));
      paymentDocs.push({
        student_id:     student._id,
        amount_paid,
        amount_due:     TUITION_FEE,
        payment_date:   monthStart(mBack),
        payment_method: pick(['Bank Transfer', 'Orange Money', 'Afrimoney', 'Cash']),
        reference:      `REF-${Date.now()}-${Math.floor(Math.random()*9999)}`,
        semester:       mBack <= 2 ? 'Semester 2, 2024/2025' : 'Semester 1, 2024/2025',
        status:         'verified',
        verified_by:    adminId,
        verified_at:    monthStart(mBack),
      });
    }
  }
  await Payment.insertMany(paymentDocs);
  console.log(`    ${paymentDocs.length} payment records created.`);

  // ── Payroll (5 months) ──
  console.log('💰  Seeding payroll...');
  const SALARIES = [3500, 4000, 3800, 4200]; // New Leones (NLe)
  const payrollDocs = [];
  for (let i = 0; i < teachers.length; i++) {
    for (const mBack of [5, 4, 3, 2, 1]) {
      const salary = SALARIES[i];
      const allowances = Math.round(salary * 0.15);
      const deductions = Math.round(salary * 0.05);
      const net_pay = salary + allowances - deductions;
      payrollDocs.push({
        teacher_id:   teachers[i]._id,
        salary_amount: salary,
        allowances,
        deductions,
        net_pay,
        pay_period:   monthStart(mBack),
        status:       mBack === 1 ? 'approved' : 'disbursed',
        approved_by:  adminId,
        approved_at:  monthStart(mBack),
        created_by:   adminId,
      });
    }
  }
  await Payroll.insertMany(payrollDocs);
  console.log(`    ${payrollDocs.length} payroll entries created.`);

  // ── Attendance (last 30 days, Mon–Fri only) ──
  console.log('📋  Seeding attendance records...');
  const STATUSES = ['present','present','present','present','present','absent','late']; // ~71% present
  const attendanceDocs = [];
  const today = new Date();
  for (const { cls, enrolled } of classes) {
    for (let d = 29; d >= 0; d--) {
      const date = new Date(today);
      date.setDate(today.getDate() - d);
      date.setHours(8, 0, 0, 0);
      const dow = date.getDay();
      if (dow === 0 || dow === 6) continue; // skip weekends

      for (const studentId of enrolled) {
        attendanceDocs.push({
          student_id:  studentId,
          class_id:    cls._id,
          date,
          status:      pick(STATUSES),
          recorded_by: adminId,
        });
      }
    }
  }
  // Bulk insert, ignore duplicate key errors
  try { await Attendance.insertMany(attendanceDocs, { ordered: false }); }
  catch (e) { /* ignore duplicate key on re-run */ }
  console.log(`    ~${attendanceDocs.length} attendance records created.`);

  // ── Report Cards (Grades) ──
  console.log('📝  Seeding grades for first student...');
  await ReportCard.deleteMany({});
  const firstStudent = students[0];
  const firstStudentClasses = classes.filter(c => c.enrolled.includes(firstStudent._id));
  const gradesDocs = firstStudentClasses.map(c => ({
    student_id: firstStudent._id,
    class_id: c.cls._id,
    semester: c.cls.semester,
    score: Math.floor(Math.random() * 30) + 70, // 70 to 100
    grade: 'A',
    comments: 'Excellent work this semester.',
    entered_by: adminId
  }));
  if (gradesDocs.length > 0) {
    await ReportCard.insertMany(gradesDocs);
    console.log(`    ${gradesDocs.length} grades added for ${firstStudent.first_name} ${firstStudent.last_name}.`);
  }

  // ── Summary ──
  console.log('\n✅  DEMO DATA SEEDING COMPLETE!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Admin:    admin@schooladmin.edu / Admin123!');
  console.log('  Teachers: e.conteh@school.edu  / Teacher123!');
  console.log('            a.koroma@school.edu  / Teacher123!');
  console.log('            i.bangura@school.edu / Teacher123!');
  console.log('            f.sesay@school.edu   / Teacher123!');
  console.log('  Students: mk001@student.edu    / Student123!');
  console.log('            (all 20 students use Student123!)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  process.exit(0);
}

main().catch(err => { console.error('❌  Seed failed:', err.message); process.exit(1); });
