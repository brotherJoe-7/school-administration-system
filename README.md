# School Administration System

License: MIT
Node.js: v24
React: 18
MongoDB: 8.x

A full-stack, web-based School Administration System. Manages students, teachers, attendance, academic records, payroll, and administrative approvals.

---

## System Overview

| Module | Description |
|---|---|
| Authentication | JWT-based login with roles: Admin, Teacher, Student |
| Dashboard | Live stats: students, tuition, attendance rate; Recharts graphs with date filters and program selections |
| Student Registration | Multi-step form with GDPR consent, program selection, admin approval |
| Attendance | Checkbox-based daily roll-call per class; real-time dashboard updates |
| Academic Reports | GPA calculation, semester grades, cumulative transcript |
| Payroll | Salary breakdown, admin approval before disbursement |
| Approval Queue | Centralized screen: registrations, payroll, transcripts, and attendance review |
| Audit Log | Every action logged with user IDs, timestamps, and actions |

---

## Technology Stack

- **Frontend**: React 18, Vite, React Router v6, Recharts, Axios
- **Backend**: Node.js, Express REST API
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT, bcryptjs (12 rounds)
- **Styling**: Vanilla CSS (custom design system, dark theme)

---

## Installation

### Prerequisites
- Node.js v18+
- MongoDB instance (local or Atlas cloud cluster)
- Git

### 1. Clone & Setup

```bash
git clone https://github.com/your-org/school-admin-system.git
cd school-admin-system
```

### 2. Backend Setup

1. Open the backend folder:
   ```bash
   cd backend
   ```
2. Create your `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Set your environment variables, including `MONGODB_URI` (pointing to your local MongoDB or Atlas cluster) and `JWT_SECRET`.
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the development server (the system will automatically connect and seed the database if it is empty):
   ```bash
   npm run dev
   ```

### 3. Frontend Setup

1. Open the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Create your `.env` file:
   ```bash
   VITE_API_URL=http://localhost:5000/api
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

The application will be accessible at http://localhost:5173

---

## Demo Credentials

The database auto-seeds the following test accounts:

| Role | Email | Password |
|---|---|---|
| Admin | admin@schooladmin.edu | Admin@123 |
| Teacher | i.koroma@schooladmin.edu | Teacher@123 |
| Student | a.sesay@student.schooladmin.edu | Student@123 |

---

## Usage Instructions

### Admin
1. Log in as Admin to access the complete dashboard, including student, teacher, and class statistics, as well as tuition collected and attendance rate metrics.
2. Filter stats and charts by program (BIT, BBIT, BSEM, BICT, DAT, and additional faculties) or by start and end dates.
3. Access the Approval Queue to verify registrations, approve payroll entries, manage transcripts, and review attendance submissions.
4. Export chart data and summaries to CSV and PDF formats directly from the dashboard.

### Teacher
1. Log in as Teacher to manage assigned classes and record attendance.
2. Select a program to filter classes, choose a class, choose a date, and check/uncheck checkboxes for present/absent students.
3. Export student attendance rosters to CSV or PDF for records.
4. Record student grades and comments for transcripts.
5. Access the monthly payroll history.

### Student
1. Register using the public multi-step form, selecting the preferred faculty program and providing GDPR consent.
2. After admin approval, log in to check your own classes and attendance rate.
3. View grades and cumulative GPA transcript, and request official transcripts.

---

## Compliance & IT Laws

### Sierra Leone ICT Regulations
- Complies with the Sierra Leone National ICT Policy (2017).
- Follows data protection and governance recommendations.
- Employs secure transaction and transit logging.

### GDPR-Style Data Privacy
- Explicit consent checked at student registration.
- Data minimisation: only necessary records are kept.
- Passwords are securely hashed with bcrypt (12 rounds).
- JWT tokens expire after 7 days to maintain session security.

### Role-Based Access Control

| Resource | Admin | Teacher | Student |
|---|---|---|---|
| Student records | Full CRUD | Read | Own only |
| Attendance | Full | Create/Edit | View own |
| Grades | Full | Create/Edit | View own |
| Payroll | Full | View own | Access Denied |
| Approval queue | Full | Access Denied | Access Denied |

---

## SDG Alignment

### SDG 4: Quality Education
Ensures inclusive and equitable quality education and promotes lifelong learning opportunities for all.
This system supports SDG 4 by:
- Digitising student enrolment and academic records.
- Providing transparent attendance and grade tracking.
- Enabling data-driven decisions on student performance.
- Reducing administrative burden so educators focus on teaching.
- Making educational administration accessible in low-resource contexts.

---

## Project Structure

```
school-admin-system/
├── frontend/                 # React + Vite app
│   ├── src/
│   │   ├── api/axios.js       # Axios instance with JWT
│   │   ├── context/           # AuthContext
│   │   ├── components/        # Sidebar, Topbar, ProtectedLayout
│   │   └── pages/             # Page components
│   └── index.html
├── backend/                  # Node.js + Express API
│   ├── config/db.js           # MongoDB connection & seeding
│   ├── middleware/auth.js     # JWT middleware
│   ├── models/                # Mongoose schemas
│   ├── routes/                # REST endpoints
│   └── server.js              # Express app entry
├── README.md
└── LICENSE.txt
```

---

## Support

For issues or questions, open a GitHub Issue or contact the system administrator at admin@schooladmin.edu.

System copyright School Administration System, Sierra Leone. Released under the MIT License.
