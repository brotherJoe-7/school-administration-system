const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });
const Class = require('./models/Class');

const curriculum = {
  'Diploma in Information Technology (DIT)': [
    { sem: 'Year 1, Semester 1', courses: ['Civic Education', 'French Language 1', 'Communication & Study Skills', 'Computer Skills', 'Creative & Innovation Studies', 'Programming Logic & Design'] },
    { sem: 'Year 1, Semester 2', courses: ['Databases, Computerised Mathematics', 'Data Communication', 'Multimedia', 'Software Engineering Principles', 'Structured Programming'] },
    { sem: 'Year 2, Semester 1', courses: ['Database Systems', 'Video Technology', 'OOP Methods 1', 'Web Design Principles', 'Fundamentals of Computer Systems', 'Cybersecurity Introduction'] },
    { sem: 'Year 2, Semester 2', courses: ['UI Design', 'MIS', 'OOP Methods 2', 'Multimedia Authoring', 'Networking Administration', 'Mobile App Development'] },
    { sem: 'Year 3, Semester 1', courses: ['Online Payment Systems', 'Cloud Computing & Virtualization', 'Event‑Driven Programming', 'Data Science Fundamentals', 'IP & Ethics', 'Data Structures & Algorithms'] },
    { sem: 'Year 3, Semester 2', courses: ['Internship Report', 'Practical Internship'] }
  ],
  'B.Sc. (Hons) Information Technology': [
    { sem: 'Year 1, Semester 1', courses: ['Civic Education, French Language 1', 'Communication & Study Skills', 'Computer Skills', 'Creative & Innovation Studies'] },
    { sem: 'Year 1, Semester 2', courses: ['Intro to Info Systems', 'OOP Methods 2', 'Probability & Statistics', 'Multimedia Authoring', 'Networking Administration', 'Mobile Commerce Systems'] },
    { sem: 'Year 2, Semester 1', courses: ['Communication in the New Economy', 'OOP Methods 1', 'Web Design 1', 'Fundamentals of Computer Systems', 'Multimedia Technology', 'Database Systems'] },
    { sem: 'Year 2, Semester 2', courses: ['System Analysis & Design', 'Entrepreneurship Fundamentals', 'Web Hosting & Design', 'IT Intellectual Property & Legal Issues', 'Operating Systems', 'Research Methodology'] },
    { sem: 'Year 3, Semester 1', courses: ['E‑Commerce Systems', 'Human Computer Interaction', 'Event‑Driven Programming', 'Web Programming Techniques', 'IT Project Management', 'Data Structures & Algorithms'] },
    { sem: 'Year 3, Semester 2', courses: ['IT Project Management', 'Supply Chain Management', 'Research Methodology', 'Decision Support Systems'] },
    { sem: 'Year 4, Semester 1', courses: ['Research Project', 'Knowledge Management', 'Distributed Systems', 'Security Implementation & Management', 'Web Hosting', 'Interactive Multimedia'] },
    { sem: 'Year 4, Semester 2', courses: ['Practical Internship', 'Internship Report'] }
  ],
  'B.Sc. (Hons) Business Information Technology': [
    { sem: 'Year 1, Semester 1', courses: ['Civic Education, French Language', 'Communication & Study Skills', 'Computer Skills', 'Creative & Innovation Studies'] },
    { sem: 'Year 1, Semester 2', courses: ['Principles of Marketing', 'Business Law', 'Info Systems Security', 'Fundamentals of Entrepreneurship', 'E‑Commerce Systems'] },
    { sem: 'Year 2, Semester 1', courses: ['System Analysis & Design', 'Intro to Info Systems', 'OOP Methods 1', 'Mobile Commerce Systems', 'Database Systems', 'Strategic Management Concepts'] },
    { sem: 'Year 2, Semester 2', courses: ['IT Project Management', 'Supply Chain Management', 'Research Methodology', 'Decision Support Systems'] },
    { sem: 'Year 3, Semester 1', courses: ['Strategic Marketing Management', 'Human Computer Interaction', 'Data Communications & Networking', 'Web Programming Techniques', 'HR Management'] },
    { sem: 'Year 3, Semester 2', courses: ['IT Project Management', 'Supply Chain Management', 'Research Methodology', 'Decision Support Systems'] },
    { sem: 'Year 4, Semester 1', courses: ['Network Administration', 'Research Project', 'Business Intelligence', 'Ethics & Professional Conduct', 'IT IP Rights & Ethics', 'Knowledge Management'] },
    { sem: 'Year 4, Semester 2', courses: ['Practical Internship', 'Internship Report'] }
  ],
  'B.Sc. (Hons) Software Engineering with Multimedia': [
    { sem: 'Year 1, Semester 1', courses: ['Civic Education, French Language', 'Communication & Study Skills', 'Computer Skills', 'Creative & Innovation Studies'] },
    { sem: 'Year 1, Semester 2', courses: ['OOP Methods 2', 'Sound Production', 'Probability & Statistics', 'Multimedia Authoring', 'Web Design 1', 'Video Technology'] },
    { sem: 'Year 2, Semester 1', courses: ['Communication in the New Economy', 'Database Systems', 'Software Engineering', 'OOP Methods 1', 'Fundamentals of Computer Systems', 'Digital Imaging'] },
    { sem: 'Year 2, Semester 2', courses: ['System Analysis & Design', 'Data Communications & Networking', 'Computer Graphics 1', 'Data Structures & Algorithms', 'Web Programming Techniques', 'Human Computer Interaction'] },
    { sem: 'Year 3, Semester 1', courses: ['Animation Studies 1', 'Interactive Multimedia', 'Research Methodology', 'IT Project Management', 'IT IP Rights & Ethics', 'Entrepreneurship Fundamentals'] },
    { sem: 'Year 3, Semester 2', courses: ['Software Testing & Reliability', 'Character Animation', 'Virtual Reality', 'Digital Production', 'Interactive Multimedia'] },
    { sem: 'Year 4, Semester 1', courses: ['Major Project', 'Advanced Multimedia Systems'] },
    { sem: 'Year 4, Semester 2', courses: ['Practical Internship', 'Internship Report'] }
  ],
  'B.Sc. (Hons) Information & Communication Technology': [
    { sem: 'Year 1, Semester 1', courses: ['Civic Education, French Language', 'Communication & Study Skills', 'Computer Skills', 'Creative & Innovation Studies'] },
    { sem: 'Year 1, Semester 2', courses: ['LAN & High Speed Technology', 'Entrepreneurship', 'OOP Methods', 'Web Programming Techniques', 'Public Speaking & Presentation Skills'] },
    { sem: 'Year 2, Semester 1', courses: ['Communication in the New Economy', 'OOP Methods', 'Database Design & Management 2', 'Mobile Systems', 'Network Design & Management', 'Data Structures & Algorithms'] },
    { sem: 'Year 2, Semester 2', courses: ['Discrete Structures', 'System Analysis & Design', 'Wireless Networks & Applications', 'Probability & Statistics', 'Wireless Internet Application', 'Research Methodology'] },
    { sem: 'Year 3, Semester 1', courses: ['Multimedia Technology', 'Computer Maintenance & Upgrade', 'Knowledge Management'] },
    { sem: 'Year 3, Semester 2', courses: ['IT IP Rights & Ethics', 'IT Project Management', 'Client/Server Architecture', 'Operating Systems', 'Major Project 1'] },
    { sem: 'Year 4, Semester 1', courses: ['Research Project', 'Advanced Networking Systems'] },
    { sem: 'Year 4, Semester 2', courses: ['Practical Internship', 'Internship Report'] }
  ]
};

const generateCode = (program, course, semStr) => {
  const pCode = program.split(' ').map(w => w[0]).join('').substring(0,3).toUpperCase();
  const yr = semStr.match(/Year (\d+)/)[1];
  const sm = semStr.match(/Semester (\d+)/)[1];
  const cCode = course.substring(0,3).toUpperCase();
  return `${pCode}${yr}${sm}-${cCode}${Math.floor(Math.random() * 90 + 10)}`;
};

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB');

    const classesToUpsert = [];

    for (const [program, semesters] of Object.entries(curriculum)) {
      for (const semData of semesters) {
        for (const course of semData.courses) {
          classesToUpsert.push({
            class_name: course,
            class_code: generateCode(program, course, semData.sem),
            program: program,
            semester: semData.sem,
            credit_hours: 3
          });
        }
      }
    }

    let inserted = 0, updated = 0;
    for (const cls of classesToUpsert) {
      const result = await Class.updateOne(
        { class_name: cls.class_name, program: cls.program, semester: cls.semester },
        { $setOnInsert: cls },
        { upsert: true }
      );
      if (result.upsertedCount) inserted++;
      else updated++;
    }

    console.log(`Done. ${inserted} new courses inserted, ${updated} already existed (untouched).`);
    console.log(`Total courses across ${Object.keys(curriculum).length} programs: ${classesToUpsert.length}`);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
