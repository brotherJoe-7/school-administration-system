# School Administration System (SaaS Platform)

A full-stack, production-ready Multi-Tenant Software-as-a-Service (SaaS) academic management platform built with **Node.js / Express**, **MongoDB**, and **React**. Designed to empower higher-education institutions globally while aligning with **SDG 4 (Quality Education)**.

---

## Sustainable Development Goal 4 (Quality Education)
This platform is explicitly designed in alignment with UN SDG 4: *Ensure inclusive and equitable quality education and promote lifelong learning opportunities for all.* By providing a robust, multi-tenant digital infrastructure, we lower the barrier to entry for schools to manage operations, track attendance, and improve student outcomes using data-driven insights.

---

## Live Demo
- **Frontend (Vercel):** https://school-administration-system.vercel.app
- **Backend (Render/Railway):** Configured via `BACKEND_URL` env var

---

## Architecture & Features

### 1. Multi-Tenant SaaS Architecture
- **Isolated Environments:** Each school operates in its own isolated tenant environment.
- **Data Privacy:** Middleware enforces row-level security and tenant isolation using a `tenant_id` on all core database records (Students, Teachers, Classes, Attendance, Payments, Payroll).
- **Dynamic Onboarding:** Schools can self-register via the landing page, automatically provisioning their tenant environment and subdomain.

### 2. Public Landing Page
- A professional, black-and-white themed entry point highlighting mission, features, and programs.
- Provides clear calls to action: "Login" for existing users and "Create School Account" for new institutions.
- Secure, exposing no sensitive data—only marketing and onboarding content.

### 3. Dynamic Dashboard
- Real-time statistics across the institution: Student count, Teacher count, Tuition collected, Attendance rates.
- API-driven dynamic filters (Program, Faculty, Date range).
- Exportable reporting (CSV and PDF) for tuition, attendance, payroll, and academic reports.

### 4. AI Assistant Integration
- Smart dashboard widgets offering predictive insights (e.g., flagging students at risk based on attendance/grades).
- Natural language query support ("Show unpaid tuition this month").
- Automated anomaly detection and report generation powered by OpenAI/Azure AI.

### 5. Compliance & Documentation
- **GDPR-style Consent**: Explicit user consent mechanisms before account activation.
- **Sierra Leone ICT Law**: Compliant auditing, reporting, and data management.
- **Open Source**: Released under the MIT License.

---

## Tech Stack

| Layer     | Technology                           |
|-----------|--------------------------------------|
| Frontend  | Next.js / React, Tailwind CSS        |
| Backend   | Node.js, Express.js                  |
| Database  | MongoDB (Mongoose) / PlanetScale     |
| Auth      | Clerk / Auth0 for multi-tenant auth  |
| AI Models | OpenAI API / Azure AI                |
| Hosting   | Vercel (frontend), Render (backend)  |

---

## Deployment & Scalability Instructions

1. **Frontend Deployment (Vercel):**
   - Connect the repository to Vercel.
   - Configure build settings (e.g., `npm run build` using Vite/Next.js).
   - Set `VITE_API_URL` to point to the backend service.

2. **Backend Deployment (Render/Railway):**
   - Deploy as a Node Web Service.
   - Set environment variables:
     - `MONGODB_URI`: Connection string to your MongoDB cluster.
     - `JWT_SECRET`: Secure key for token generation.
     - `OPENAI_API_KEY`: Key for AI assistant functionality.

3. **Database Configuration:**
   - Ensure collections use compound indexes combining `tenant_id` and other query keys for performance and isolation.

---

## License

MIT License — see [LICENSE.txt](./LICENSE.txt)
