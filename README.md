# MediSlot

A web-based doctor appointment booking platform focused on in-person clinic visits in Indonesia. Patients can discover doctors, book appointments, and manage their health records — all in one place.

> Capstone project · MongoDB Developer Path · Universitas Gadjah Mada · 2025

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Axios, Context API |
| Backend | Node.js 18, Express.js 4.18 |
| Database | MongoDB Atlas M0, Mongoose v8 |
| Auth | JWT (7-day expiry) + Google OAuth 2.0 (Passport.js) |
| AI | Groq API — `llama-3.3-70b-versatile` |
| Deploy | Vercel (frontend) · Render.com (backend) · MongoDB Atlas |

---

## Features

### Patient
- Register / login with email or Google OAuth
- Search doctors by specialization, city, and BPJS acceptance
- View doctor profiles, clinic info, and available time slots
- Book appointments with automatic queue number assignment
- Patient dashboard — view upcoming and past appointments, cancel bookings
- Full medical record history with AI-generated health summary
- AI Symptom Checker — describe symptoms, get specialist recommendations

### Doctor
- Register as a doctor via email or Google OAuth
- Onboarding profile setup (specialization, clinic, license, fee, BPJS)
- Manage weekly schedules with configurable slot durations
- View daily appointment queue and patient details
- Create medical records for completed appointments (diagnosis, prescription, vitals)
- View all patient medical records linked to their clinic

### Admin
- Dashboard with platform-wide doctor statistics
- Verify, reject, or review pending doctor registrations
- Manage all doctors and patients on the platform

---

## Project Structure

```
mediSlot/
├── backend/
│   ├── config/
│   │   ├── db.js                  ← MongoDB Atlas connection
│   │   └── passport.js            ← Google OAuth strategy
│   ├── controllers/
│   │   ├── authController.js      ← register, login, Google OAuth, profile
│   │   ├── doctorController.js
│   │   ├── scheduleController.js  ← slot generation logic
│   │   ├── appointmentController.js
│   │   ├── medicalRecordController.js
│   │   └── aiController.js        ← Groq API calls
│   ├── middleware/
│   │   └── authMiddleware.js      ← protect, authorize(role)
│   ├── models/
│   │   ├── User.js
│   │   ├── DoctorProfile.js
│   │   ├── Schedule.js
│   │   ├── Appointment.js
│   │   └── MedicalRecord.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── doctorRoutes.js
│   │   ├── scheduleRoutes.js
│   │   ├── appointmentRoutes.js
│   │   ├── medicalRecordRoutes.js
│   │   └── aiRoutes.js
│   ├── seeders/seed.js            ← npm run seed
│   ├── .env.example
│   └── server.js
└── frontend/
    └── src/
        ├── components/
        │   ├── ui.jsx             ← shared design system (Card, Badge, Btn, DoctorCard, …)
        │   ├── Sidebar.jsx
        │   └── TopBar.jsx
        ├── context/AuthContext.jsx
        ├── pages/
        │   ├── Login.jsx          ← sign in + register (email & Google)
        │   ├── Home.jsx           ← role-aware dashboard
        │   ├── SearchDoctor.jsx
        │   ├── DoctorDetail.jsx
        │   ├── BookingForm.jsx
        │   ├── PatientDashboard.jsx
        │   ├── PatientProfile.jsx
        │   ├── MedicalHistory.jsx
        │   ├── SymptomChecker.jsx
        │   ├── DoctorDashboard.jsx
        │   ├── DoctorSchedule.jsx
        │   ├── DoctorProfileSetup.jsx
        │   ├── DoctorRecord.jsx
        │   ├── AdminVerify.jsx
        │   ├── AdminDoctors.jsx
        │   └── AdminUsers.jsx
        ├── services/api.js        ← Axios instance with JWT interceptor
        └── App.jsx                ← routes + ProtectedRoute
```

---

## Getting Started

### 1. Clone & Install

```bash
git clone <repo-url>
cd mediSlot

# Backend
cd backend && npm install

# Frontend (new terminal)
cd frontend && npm install
```

### 2. Environment Variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/medislot
JWT_SECRET=<random-32-char-string>
JWT_EXPIRE=7d
GOOGLE_CLIENT_ID=<from-google-cloud-console>
GOOGLE_CLIENT_SECRET=<from-google-cloud-console>
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
GROQ_API_KEY=gsk_<from-console.groq.com>
CLIENT_URL=http://localhost:3000
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → **APIs & Services** → **Credentials**
3. Create **OAuth 2.0 Client ID** → Web Application
4. Add Authorized Redirect URI: `http://localhost:5000/api/auth/google/callback`
5. Copy the Client ID and Secret into `.env`

### 4. Run

```bash
# Terminal 1 — Backend (http://localhost:5000)
cd backend && npm run dev

# Terminal 2 — Frontend (http://localhost:3000)
cd frontend && npm start
```

### 5. Seed Demo Data

```bash
cd backend && npm run seed
```

This creates demo accounts (password: `password123`):

| Email | Role |
|-------|------|
| budi@test.com | Patient |
| siti@test.com | Patient |
| ahmad@test.com | Doctor (Sp.PD) |
| dewi@test.com | Doctor (Sp.A) |
| reza@test.com | Doctor (Sp.OG) |
| admin@test.com | Admin |

---

## API Reference

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/google
GET    /api/auth/google/callback
GET    /api/auth/me                    [JWT]
PUT    /api/auth/profile               [JWT]
GET    /api/auth/admin/users           [JWT, admin]
DELETE /api/auth/admin/users/:id       [JWT, admin]
```

### Doctors
```
GET    /api/doctors                    ?city= &specialization= &acceptBPJS= &search=
GET    /api/doctors/:id
GET    /api/doctors/my-profile         [JWT, doctor]
POST   /api/doctors/profile            [JWT, doctor]
PUT    /api/doctors/profile            [JWT, doctor]
GET    /api/doctors/admin/all          [JWT, admin]
PUT    /api/doctors/admin/:id/verify   [JWT, admin]
```

### Schedules
```
GET    /api/schedules/:doctorId
GET    /api/schedules/:doctorId/slots  ?date=YYYY-MM-DD
POST   /api/schedules                  [JWT, doctor]
PUT    /api/schedules/:id              [JWT, doctor]
```

### Appointments
```
POST   /api/appointments               [JWT, patient]
GET    /api/appointments/my            [JWT, patient]
GET    /api/appointments/doctor        [JWT, doctor]  ?date=
PUT    /api/appointments/:id/status    [JWT]
```

### Medical Records
```
POST   /api/medical-records            [JWT, doctor]
GET    /api/medical-records/my         [JWT, patient]
GET    /api/medical-records/:id        [JWT]
GET    /api/medical-records/patient/:patientId  [JWT, doctor]
```

### AI
```
POST   /api/ai/symptom-check           [JWT]  { symptoms: "string" }
GET    /api/ai/health-summary          [JWT, patient]
```

---

## Database Schema

### User
```
_id, name, email, password(nullable), googleId(nullable),
role(patient|doctor|admin), phone, avatar,
dateOfBirth, gender, bloodType, allergies[], timestamps
```

### DoctorProfile
```
_id, userId(→User), specialization, licenseNumber,
clinicName, clinicAddress, city, consultationFee,
acceptBPJS, bio, isVerified, verificationStatus, rating,
yearsOfExperience, additionalDegrees[], timestamps
```

### Schedule
```
_id, doctorId(→DoctorProfile), dayOfWeek(0–6),
startTime(HH:MM), endTime(HH:MM),
slotDuration(min, default 30), maxPatients, isActive, timestamps
```

### Appointment
```
_id, patientId(→User), doctorId(→DoctorProfile),
date, timeSlot(HH:MM), queueNumber, notes,
status(pending|confirmed|cancelled|completed), timestamps
```

### MedicalRecord
```
_id, appointmentId(→Appointment, unique), patientId(→User),
doctorId(→DoctorProfile), clinicName, date, time,
chiefComplaint, diagnosis, symptoms[],
vitalSigns{ bloodPressure, heartRate, temperature, weight, height },
treatment, prescription[{ name, dosage, frequency, duration }],
notes, followUpDate, timestamps
```

---

## Key Business Rules

- A doctor must be `verificationStatus: verified` to appear in patient search
- `queueNumber` = count of non-cancelled appointments for the same doctor + date + 1
- Available time slots = generated from Schedule minus already-booked slots that day
- Medical records can only be created when Appointment `status = completed`
- Medical record access is restricted to the matching patient or the creating doctor
- Google OAuth users have `password: null` — no password is ever required from them
- AI calls are server-side only — the Groq API key is never exposed to the frontend

---

## Deployment

| Service | Purpose |
|---------|---------|
| [Vercel](https://vercel.com) | Frontend (React) |
| [Render.com](https://render.com) | Backend (Node/Express) |
| [MongoDB Atlas M0](https://cloud.mongodb.com) | Database (free tier) |

Set `REACT_APP_API_URL=https://<your-render-url>/api` in Vercel environment variables.  
Update `CLIENT_URL` and `GOOGLE_CALLBACK_URL` in the backend `.env` to use production URLs.

---

## Out of Scope

- BPJS PCare integration (requires official government API key)
- Payment gateway / booking deposit
- Teleconsultation / video call
- SATUSEHAT integration
- Native mobile app
