const mongoose = require('mongoose');
require('dotenv').config();
const Class = require('./models/Class');
const Student = require('./models/Student');
const Attendance = require('./models/Attendance');

const PROGRAMS = {
  DIT:  'Diploma in Information Technology',
  BIT:  'B.Sc. (Hons) Information Technology',
  BBIT: 'B.Sc. (Hons) Business Information Technology',
  BSEM: 'B.Sc. (Hons) Software Engineering with Multimedia',
  BICT: 'B.Sc. (Hons) Information and Communication Technology',
};

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected');

  // Step 1: Enroll students into classes by matching program
  for (const fullName of Object.values(PROGRAMS)) {
    const studs = await Student.find({ program: fullName }).limit(4);
    const studIds = studs.map(s => s._id);
    const result = await Class.updateMany({ program: fullName }, { $set: { students: studIds } });
    console.log(`Enrolled ${studIds.length} students into ${result.modifiedCount} classes for: ${fullName}`);
  }

  // Step 2: Seed attendance for all classes
  const classes = await Class.find({});
  const today = new Date();
  let docs = [];

  for (const cls of classes) {
    if (!cls.students || cls.students.length === 0) continue;
    for (let d = 29; d >= 0; d--) {
      const date = new Date(today);
      date.setDate(today.getDate() - d);
      date.setHours(8, 0, 0, 0);
      const dow = date.getDay();
      if (dow === 0 || dow === 6) continue;
      for (const sid of cls.students) {
        const statuses = ['present','present','present','present','absent','late'];
        docs.push({
          student_id: sid,
          class_id: cls._id,
          date: new Date(date),
          status: statuses[Math.floor(Math.random() * statuses.length)],
        });
      }
    }
  }

  // Clear old attendance first
  await Attendance.deleteMany({});
  const inserted = await Attendance.insertMany(docs, { ordered: false }).catch(e => {
    console.log('Some records skipped:', e.writeErrors ? e.writeErrors.length : e.message);
    return { length: docs.length };
  });
  console.log(`Seeded ${docs.length} attendance records`);

  console.log('\nAll done! Dashboard should now show live data.');
  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
