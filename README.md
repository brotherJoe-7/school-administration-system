# School Administration System (SaaS Platform)

A full-stack, production-ready Multi-Tenant Software-as-a-Service (SaaS) academic management platform built with **Node.js / Express**, **MongoDB**, and **React**. Designed to empower higher-education institutions globally while aligning with **SDG 4 (Quality Education)**.

---

## Table of Contents
1. [Overview](#overview)
2. [Sustainable Development Goal 4](#sustainable-development-goal-4)
3. [Live Demo](#live-demo)
4. [Architecture & Features](#architecture--features)
5. [Tech Stack](#tech-stack)
6. [Getting Started & Local Setup](#getting-started--local-setup)
7. [Deployment & Scalability](#deployment--scalability)
8. [License](#license)

---

## Overview
This platform serves as a central hub for school administration, enabling institutions to efficiently manage student records, financial tracking, academic grading, and comprehensive attendance reporting. By leveraging a multi-tenant structure, the system offers data isolation and robust security for multiple schools on a single infrastructure.

---

## Sustainable Development Goal 4
This platform is explicitly designed in alignment with UN SDG 4: *Ensure inclusive and equitable quality education and promote lifelong learning opportunities for all.* By providing a robust, multi-tenant digital infrastructure, we lower the barrier to entry for schools to manage operations, track attendance, and improve student outcomes using data-driven insights.

---

## Live Demo
- **Frontend (Vercel):** [https://school-administration-system.vercel.app](https://school-administration-system.vercel.app)
- **Backend (Render/Railway):** Configured via `BACKEND_URL` environment variable

---

## Architecture & Features

### 1. Multi-Tenant SaaS Architecture
- **Isolated Environments:** Each school operates in its own isolated tenant environment.
- **Data Privacy:** Middleware enforces row-level security and tenant isolation using a `tenant_id` on all core database records (Students, Teachers, Classes, Attendance, Payments, Payroll).
- **Dynamic Onboarding:** Schools can self-register via the landing page, automatically provisioning their tenant environment and subdomain.

### 2. Public Landing Page
- A professional, dynamic-themed entry point highlighting the mission, features, and programs.
- Provides clear calls to action: "Login" for existing users and "Create School Account" for new institutions.
- Secure, exposing no sensitive data—only marketing and onboarding content.

### 3. Dynamic Dashboard
- Real-time statistics across the institution: Student count, Teacher count, Tuition collected, Attendance rates.
- API-driven dynamic filters (Program, Faculty, Date range).
- Exportable reporting (CSV and PDF) for tuition, attendance, payroll, and academic reports.

### 4. AI Assistant Integration
- Smart dashboard widgets offering predictive insights (e.g., flagging students at risk based on attendance/grades).
- Natural language query support (e.g., "Show unpaid tuition this month").
- Automated anomaly detection and report generation powered by Gemini AI.

### 5. Compliance & Documentation
- **GDPR-style Consent:** Explicit user consent mechanisms before account activation.
- **Data Auditing:** Compliant auditing, reporting, and data management in alignment with digital standards.
- **Open Source:** Released under the MIT License.

---

## Tech Stack

| Layer     | Technology                           |
|-----------|--------------------------------------|
| **Frontend**  | React, Vite, CSS Modules        |
| **Backend**   | Node.js, Express.js                  |
| **Database**  | MongoDB (Mongoose)             |
| **Auth**      | Custom JWT authentication for multi-tenant auth  |
| **AI Models** | Google Gemini AI                |
| **Hosting**   | Vercel (frontend), Render (backend)  |

---

## Getting Started & Local Setup

Follow these steps to download, install, and run the School Administration System locally on your machine.

### Prerequisites
- **Node.js** (v16.0 or higher recommended)
- **MongoDB** (Local instance or MongoDB Atlas cluster)
- **Git** (for downloading the source code)

### 1. Download the Source Code
Clone the repository to your local machine:
```bash
git clone https://github.com/brotherJoe-7/school-administration-system.git
cd school-administration-system
```

### 2. Install Dependencies
The project is split into two directories: `frontend` and `backend`. You need to install dependencies for both.

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

### 3. Setup Environment Variables
You need to configure the environment variables for both the backend and frontend.

**Backend (`backend/.env`):**
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/school_saas  # Or your MongoDB Atlas URI
JWT_SECRET=your_super_secret_jwt_key_here
GEMINI_API_KEY=YOUR_GEMINI_API_KEY  # Get from Google AI Studio (optional for testing)
NODE_ENV=development
```

**Frontend (`frontend/.env`):**
Create a `.env` file in the `frontend/` directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_AI_AUTO_LOAD=false
```

### 4. Run the Application
Open two separate terminal windows/tabs to run the backend and frontend simultaneously.

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```
*The backend server should start on `http://localhost:5000` and automatically connect to MongoDB.*

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
*The Vite development server will start. Open your browser and navigate to `http://localhost:5173`.*

### 5. Initial System Setup
1. Open `http://localhost:5173` in your browser.
2. Click **Create School Account** to register a new school (tenant) and a superadmin user.
3. Once registered, log in to access the platform.
4. From the Superadmin or Admin dashboard, you can begin registering teachers, students, and setting up classes.

---

## Deployment & Scalability

### 1. Frontend Deployment (Vercel)
- Connect the repository to Vercel.
- Configure build settings (`npm run build` using Vite).
- Set `VITE_API_URL` to point to the backend service.

### 2. Backend Deployment (Render/Railway)
- Deploy as a Node Web Service.
- Set essential environment variables:
  - `MONGODB_URI`: Connection string to your MongoDB cluster.
  - `JWT_SECRET`: Secure key for token generation.
  - `GEMINI_API_KEY`: Key for AI assistant functionality (replace `OPENAI_API_KEY`).

### 3. Database Configuration
- Ensure collections use compound indexes combining `tenant_id` and other query keys to optimize performance and guarantee strict tenant isolation.

---

## License

This project is licensed under the MIT License — see the [LICENSE.txt](./LICENSE.txt) file for details.
