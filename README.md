# School Administration System

A full-stack, production-ready academic management system built with **Node.js / Express**, **MongoDB**, and **React**. Designed for higher-education institutions in Sierra Leone, GDPR-compliant and ICT Law–aligned.

---

## Live Demo
- **Frontend (Vercel):** https://school-administration-system.vercel.app
- **Backend (Render/Railway):** Configured via `BACKEND_URL` env var

---

## Tech Stack

| Layer     | Technology                           |
|-----------|--------------------------------------|
| Frontend  | React 18, Vite, Recharts, jsPDF      |
| Backend   | Node.js, Express.js                  |
| Database  | MongoDB (Mongoose ODM)               |
| Auth      | JWT (jsonwebtoken) + bcryptjs        |
| Hosting   | Vercel (frontend) + Render (backend) |

---

## Program Structures (Academic Curriculum)

All courses are stored in MongoDB and fetched dynamically. No data is hardcoded in the frontend.

### Diploma in Information Technology (DIT)

| Semester             | Courses |
|----------------------|---------|
| Year 1, Semester 1   | Civic Education, French Language 1, Communication & Study Skills, Computer Skills, Creative & Innovation Studies, Programming Logic & Design |
| Year 1, Semester 2   | Databases & Computerised Mathematics, Data Communication, Multimedia, Software Engineering Principles, Structured Programming |
| Year 2, Semester 1   | Database Systems, Video Technology, OOP Methods 1, Web Design Principles, Fundamentals of Computer Systems, Cybersecurity Introduction |
| Year 2, Semester 2   | UI Design, MIS, OOP Methods 2, Multimedia Authoring, Networking Administration, Mobile App Development |
| Year 3, Semester 1   | Online Payment Systems, Cloud Computing & Virtualization, Event‑Driven Programming, Data Science Fundamentals, IP & Ethics, Data Structures & Algorithms |
| Year 3, Semester 2   | Internship Report, Practical Internship |

---

### B.Sc. (Hons) Information Technology

| Semester             | Courses |
|----------------------|---------|
| Year 1, Semester 1   | Civic Education, French Language 1, Communication & Study Skills, Computer Skills, Creative & Innovation Studies |
| Year 1, Semester 2   | Intro to Info Systems, OOP Methods 2, Probability & Statistics, Multimedia Authoring, Networking Administration, Mobile Commerce Systems |
| Year 2, Semester 1   | Communication in the New Economy, OOP Methods 1, Web Design 1, Fundamentals of Computer Systems, Multimedia Technology, Database Systems |
| Year 2, Semester 2   | System Analysis & Design, Entrepreneurship Fundamentals, Web Hosting & Design, IT IP & Legal Issues, Operating Systems, Research Methodology |
| Year 3, Semester 1   | E‑Commerce Systems, Human Computer Interaction, Event‑Driven Programming, Web Programming Techniques, IT Project Management, Data Structures & Algorithms |
| Year 3, Semester 2   | IT Project Management, Supply Chain Management, Research Methodology, Decision Support Systems |
| Year 4, Semester 1   | Research Project, Knowledge Management, Distributed Systems, Security Implementation & Management, Web Hosting, Interactive Multimedia |
| Year 4, Semester 2   | Practical Internship, Internship Report |

---

### B.Sc. (Hons) Business Information Technology

| Semester             | Courses |
|----------------------|---------|
| Year 1, Semester 1   | Civic Education, French Language, Communication & Study Skills, Computer Skills, Creative & Innovation Studies |
| Year 1, Semester 2   | Principles of Marketing, Business Law, Info Systems Security, Fundamentals of Entrepreneurship, E‑Commerce Systems |
| Year 2, Semester 1   | System Analysis & Design, Intro to Info Systems, OOP Methods 1, Mobile Commerce Systems, Database Systems, Strategic Management Concepts |
| Year 2, Semester 2   | IT Project Management, Supply Chain Management, Research Methodology, Decision Support Systems |
| Year 3, Semester 1   | Strategic Marketing Management, Human Computer Interaction, Data Communications & Networking, Web Programming Techniques, HR Management |
| Year 3, Semester 2   | IT Project Management, Supply Chain Management, Research Methodology, Decision Support Systems |
| Year 4, Semester 1   | Network Administration, Research Project, Business Intelligence, Ethics & Professional Conduct, IT IP Rights & Ethics, Knowledge Management |
| Year 4, Semester 2   | Practical Internship, Internship Report |

---

### B.Sc. (Hons) Software Engineering with Multimedia

| Semester             | Courses |
|----------------------|---------|
| Year 1, Semester 1   | Civic Education, French Language, Communication & Study Skills, Computer Skills, Creative & Innovation Studies |
| Year 1, Semester 2   | OOP Methods 2, Sound Production, Probability & Statistics, Multimedia Authoring, Web Design 1, Video Technology |
| Year 2, Semester 1   | Communication in the New Economy, Database Systems, Software Engineering, OOP Methods 1, Fundamentals of Computer Systems, Digital Imaging |
| Year 2, Semester 2   | System Analysis & Design, Data Communications & Networking, Computer Graphics 1, Data Structures & Algorithms, Web Programming Techniques, Human Computer Interaction |
| Year 3, Semester 1   | Animation Studies 1, Interactive Multimedia, Research Methodology, IT Project Management, IT IP Rights & Ethics, Entrepreneurship Fundamentals |
| Year 3, Semester 2   | Software Testing & Reliability, Character Animation, Virtual Reality, Digital Production, Interactive Multimedia |
| Year 4, Semester 1   | Major Project, Advanced Multimedia Systems |
| Year 4, Semester 2   | Practical Internship, Internship Report |

---

### B.Sc. (Hons) Information & Communication Technology

| Semester             | Courses |
|----------------------|---------|
| Year 1, Semester 1   | Civic Education, French Language, Communication & Study Skills, Computer Skills, Creative & Innovation Studies |
| Year 1, Semester 2   | LAN & High Speed Technology, Entrepreneurship, OOP Methods, Web Programming Techniques, Public Speaking & Presentation Skills |
| Year 2, Semester 1   | Communication in the New Economy, OOP Methods, Database Design & Management 2, Mobile Systems, Network Design & Management, Data Structures & Algorithms |
| Year 2, Semester 2   | Discrete Structures, System Analysis & Design, Wireless Networks & Applications, Probability & Statistics, Wireless Internet Application, Research Methodology |
| Year 3, Semester 1   | Multimedia Technology, Computer Maintenance & Upgrade, Knowledge Management |
| Year 3, Semester 2   | IT IP Rights & Ethics, IT Project Management, Client/Server Architecture, Operating Systems, Major Project 1 |
| Year 4, Semester 1   | Research Project, Advanced Networking Systems |
| Year 4, Semester 2   | Practical Internship, Internship Report |

---

## Dynamic Integration

All program and course data is fetched dynamically from MongoDB. The system provides:

- `GET /api/classes/programs` — returns all distinct programs in the DB
- `GET /api/classes/semesters?program=<name>` — returns all semesters for a given program
- `GET /api/classes?program=<name>&semester=<sem>` — filter courses by program + semester

Every frontend page (Dashboard, Classes, Attendance, Reports, Registration) uses these endpoints to populate its dropdowns dynamically. **No program names or semester labels are hardcoded in the frontend.**

---

## Architecture

```
school-administration-system/
├── backend/
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express route handlers
│   ├── middleware/       # JWT auth + RBAC
│   ├── seed_curriculum.js  # Curriculum seeder (run once)
│   └── index.js
└── frontend/
    ├── src/
    │   ├── pages/       # React page components
    │   ├── components/  # Shared UI components
    │   ├── context/     # AuthContext
    │   └── api/         # Axios instance
    └── vite.config.js
```

---

## Role-Based Access Control (RBAC)

| Feature                 | Admin | Teacher | Student |
|-------------------------|:-----:|:-------:|:-------:|
| Register Students       | ✅    | ❌       | ❌      |
| Create Teachers         | ✅    | ❌       | ❌      |
| Promote Teacher→Admin   | ✅    | ❌       | ❌      |
| Manage Payroll          | ✅    | ❌       | ❌      |
| Approve Queue           | ✅    | ❌       | ❌      |
| View Audit Log          | ✅    | ❌       | ❌      |
| Record Attendance       | ✅    | ✅       | ❌      |
| Enter Grades            | ✅    | ✅       | ❌      |
| Enroll in Classes       | ❌    | ❌       | ✅      |
| View Own Transcript     | ❌    | ❌       | ✅      |
| View Own Attendance     | ❌    | ❌       | ✅      |
| View Own Payments       | ❌    | ❌       | ✅      |

---

## Student Onboarding Flow

1. **Admin registers student** — System auto-generates a `905XXXXX` student ID
2. **Admin shares the ID** — via the secure pop-up shown after registration (e.g. WhatsApp)
3. **Student visits `/setup`** — enters their ID to claim their account
4. **Student sets credentials** — email + password + GDPR consent
5. **Student logs in** — full dashboard access

---

## Environment Variables

**Backend** (`.env`):
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
PORT=5000
```

**Frontend** (`.env`):
```
VITE_API_URL=https://your-backend-url.com/api
```

---

## Seeding the Curriculum

Run once after first deploy to populate all 177 courses across 5 programs:

```bash
cd backend
node seed_curriculum.js
```

> ⚠️ This **wipes** existing classes before inserting. Run only during initial setup or when refreshing curriculum data.

---

## Compliance

- **GDPR**: All students must give explicit consent before account activation. Consent is stored and timestamped.
- **Sierra Leone ICT Law**: All audit logs, attendance sheets, and exported reports carry the disclaimer `Sierra Leone ICT Law & GDPR Compliant`.
- **Data Minimisation**: Passwords are hashed with bcrypt (12 rounds). JWTs expire. Sensitive fields excluded from all API responses.

---

## Roadmap to a World-Class System

To elevate this platform from an excellent MVP to a top-grade, world-class educational ERP, the following features are targeted for future releases:

1. **Automated Notification Engine**
   - Integration with SendGrid / Nodemailer for automated emails.
   - SMS gateways for fee reminders, attendance alerts, and enrollment confirmations.
2. **Integrated Payment Gateways**
   - Migration from manual payment logging to automated tuition processing via Paystack, Stripe, or local Mobile Money APIs (Orange Money / Afrimoney).
3. **Advanced e-Learning (LMS) Features**
   - **File Management**: Allowing teachers to upload course materials, syllabi, and assignment briefs.
   - **Student Submissions**: Secure portals for students to upload coursework and projects.
4. **Intelligent Scheduling & Pre-requisites**
   - **Timetable Conflict Engine**: Automatically alerting admins if a teacher or student is double-booked.
   - **Academic Enforcements**: Hard-blocking students from enrolling in advanced courses if they haven't passed the prerequisite classes.
5. **Enhanced Security & Recovery**
   - **Two-Factor Authentication (2FA)** for Admins and Teachers.
   - Automated "Forgot Password" self-service email flows.
6. **Predictive Analytics & Advanced Reporting**
   - Graphical dashboard overlays predicting student retention, failure risks, and revenue forecasting.

---

## License

MIT License — see [LICENSE.txt](./LICENSE.txt)
