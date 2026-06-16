const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const Teacher = require('./models/Teacher');
const Student = require('./models/Student');

async function clean() {
  await connectDB();
  await Teacher.deleteMany({});
  await Student.deleteMany({});
  console.log('All mockup teachers and students have been deleted from the database.');
  process.exit(0);
}

clean();
