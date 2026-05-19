# MediSlot 🏥

Platform web booking appointment dokter dan rekam medis digital.

**Stack**: MongoDB · Express.js · React.js · Node.js (MERN)

---

## Setup Cepat

### 1. Clone & Install

```bash
git clone <repo-url>
cd mediSlot

# Install backend
cd backend && npm install

# Install frontend (terminal baru)
cd frontend && npm install
```

### 2. Konfigurasi Environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env dan isi semua nilai yang diperlukan
```

Yang perlu diisi di `.env`:

- `MONGO_URI` — dari MongoDB Atlas (buat cluster gratis di mongodb.com)
- `JWT_SECRET` — string random panjang (bisa generate di random.org)
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` — dari Google Cloud Console
- `GEMINI_API_KEY` — dari aistudio.google.com

### 3. Setup Google OAuth

1. Buka [Google Cloud Console](https://console.cloud.google.com)
2. Buat project baru → "APIs & Services" → "Credentials"
3. Buat "OAuth 2.0 Client ID" → pilih "Web Application"
4. Tambahkan Authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
5. Copy Client ID dan Client Secret ke `.env`

### 4. Jalankan

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm start
```

Backend: http://localhost:5000
Frontend: http://localhost:3000

---

## Struktur Folder

```
mediSlot/
├── CLAUDE.md              ← Konteks untuk Claude Code
├── .claude/               ← Konfigurasi Claude Code
│   ├── settings.json
│   ├── agents/
│   ├── commands/
│   └── skills/
├── backend/
│   ├── config/            ← db.js, passport.js
│   ├── controllers/       ← Logic bisnis per fitur
│   ├── middleware/        ← Auth middleware
│   ├── models/            ← Mongoose schemas
│   ├── routes/            ← Express routes
│   └── server.js
└── frontend/
    └── src/
        ├── components/    ← Komponen reusable
        ├── context/       ← AuthContext
        ├── pages/         ← Halaman aplikasi
        └── services/      ← API calls (axios)
```

---

## Fitur MVP

- ✅ Auth: Register, Login, Google OAuth
- ✅ Cari dokter (filter spesialisasi, kota, BPJS)
- ✅ Booking appointment + nomor antrian virtual
- ✅ Dashboard pasien & dokter
- ✅ Rekam medis digital
- ✅ AI Symptom Checker (Gemini API)
- ✅ AI Medical Record Summarizer (Gemini API)

---

## Penggunaan Claude Code

Project ini dikonfigurasi untuk Claude Code. Buka di terminal:

```bash
cd mediSlot
claude
```

Command tersedia:

- `/new-feature <deskripsi>` — tambah fitur baru mengikuti pola project
- `/security-reviewer` — review keamanan kode

Claude Code akan membaca `CLAUDE.md` secara otomatis untuk konteks project.
