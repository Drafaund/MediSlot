const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const Schedule = require('../models/Schedule');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');

function nextWeekday(dayOfWeek) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const diff = (dayOfWeek - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d;
}

function prevWeekday(dayOfWeek, weeksBack = 1) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const diff = (d.getDay() - dayOfWeek + 7) % 7 || 7;
  d.setDate(d.getDate() - diff - (weeksBack - 1) * 7);
  return d;
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Terhubung ke MongoDB');

  await Promise.all([
    User.deleteMany({}),
    DoctorProfile.deleteMany({}),
    Schedule.deleteMany({}),
    Appointment.deleteMany({}),
    MedicalRecord.deleteMany({})
  ]);
  console.log('Semua koleksi dibersihkan');

  const salt = await bcrypt.genSalt(10);
  const hashedPw = await bcrypt.hash('password123', salt);

  // ── Users ────────────────────────────────────────────────────────────────
  const users = await User.insertMany([
    { name: 'Budi Santoso',    email: 'budi@test.com',  password: hashedPw, role: 'patient', phone: '081234567890' },
    { name: 'Siti Rahma',      email: 'siti@test.com',  password: hashedPw, role: 'patient', phone: '081234567891' },
    { name: 'Dr. Ahmad Fauzi', email: 'ahmad@test.com', password: hashedPw, role: 'doctor',  phone: '081234567892' },
    { name: 'Dr. Dewi Kusuma', email: 'dewi@test.com',  password: hashedPw, role: 'doctor',  phone: '081234567893' },
    { name: 'Dr. Reza Pratama',email: 'reza@test.com',  password: hashedPw, role: 'doctor',  phone: '081234567894' },
    { name: 'Admin MediSlot',  email: 'admin@test.com', password: hashedPw, role: 'admin',   phone: '081234567895' },
  ]);
  const [budi, siti, ahmad, dewi, reza] = users;
  console.log('Users dibuat');

  // ── Doctor Profiles ───────────────────────────────────────────────────────
  const profiles = await DoctorProfile.insertMany([
    {
      userId: ahmad._id,
      specialization: 'Penyakit Dalam',
      licenseNumber: 'STR-PD-2024-001',
      clinicName: 'Klinik Pratama Sehat Sejahtera',
      clinicAddress: 'Jl. Mangkubumi No. 12, Yogyakarta',
      city: 'Yogyakarta',
      consultationFee: 150000,
      acceptBPJS: true,
      bio: 'Dokter spesialis penyakit dalam dengan fokus pada diabetes, hipertensi, dan penyakit metabolik.',
      yearsOfExperience: 10,
      isVerified: true
    },
    {
      userId: dewi._id,
      specialization: 'Anak',
      licenseNumber: 'STR-A-2024-002',
      clinicName: 'Klinik Anak Tumbuh Sehat',
      clinicAddress: 'Jl. Kaliurang KM 5, Yogyakarta',
      city: 'Yogyakarta',
      consultationFee: 125000,
      acceptBPJS: true,
      bio: 'Dokter spesialis anak dengan fokus pada tumbuh kembang anak dan penyakit infeksi pada anak.',
      yearsOfExperience: 8,
      isVerified: true
    },
    {
      userId: reza._id,
      specialization: 'Obstetri & Ginekologi',
      licenseNumber: 'STR-OG-2024-003',
      clinicName: 'Klinik Pratama Bunda',
      clinicAddress: 'Jl. Parangtritis No. 88, Yogyakarta',
      city: 'Yogyakarta',
      consultationFee: 175000,
      acceptBPJS: false,
      bio: 'Dokter spesialis kebidanan dan kandungan. Melayani pemeriksaan kehamilan, USG, dan konsultasi kesehatan reproduksi wanita.',
      yearsOfExperience: 7,
      isVerified: true
    }
  ]);
  const [ahmadProfile, dewiProfile, rezaProfile] = profiles;
  console.log('Doctor profiles dibuat');

  // ── Schedules ─────────────────────────────────────────────────────────────
  await Schedule.insertMany([
    // Ahmad - Sp.PD: Senin, Rabu, Jumat
    { doctorId: ahmadProfile._id, dayOfWeek: 1, startTime: '08:00', endTime: '12:00', slotDuration: 30, maxPatients: 8, isActive: true },
    { doctorId: ahmadProfile._id, dayOfWeek: 3, startTime: '08:00', endTime: '12:00', slotDuration: 30, maxPatients: 8, isActive: true },
    { doctorId: ahmadProfile._id, dayOfWeek: 5, startTime: '08:00', endTime: '11:00', slotDuration: 30, maxPatients: 6, isActive: true },
    // Dewi - Sp.A: Selasa, Kamis, Sabtu
    { doctorId: dewiProfile._id,  dayOfWeek: 2, startTime: '09:00', endTime: '12:00', slotDuration: 30, maxPatients: 6, isActive: true },
    { doctorId: dewiProfile._id,  dayOfWeek: 4, startTime: '09:00', endTime: '12:00', slotDuration: 30, maxPatients: 6, isActive: true },
    { doctorId: dewiProfile._id,  dayOfWeek: 6, startTime: '09:00', endTime: '12:00', slotDuration: 30, maxPatients: 6, isActive: true },
    // Reza - Sp.OG: Senin, Rabu, Sabtu
    { doctorId: rezaProfile._id,  dayOfWeek: 1, startTime: '13:00', endTime: '17:00', slotDuration: 30, maxPatients: 8, isActive: true },
    { doctorId: rezaProfile._id,  dayOfWeek: 3, startTime: '13:00', endTime: '17:00', slotDuration: 30, maxPatients: 8, isActive: true },
    { doctorId: rezaProfile._id,  dayOfWeek: 6, startTime: '09:00', endTime: '13:00', slotDuration: 30, maxPatients: 8, isActive: true },
  ]);
  console.log('Schedules dibuat');

  // ── Dates ──────────────────────────────────────────────────────────────────
  const pastMonday2w = prevWeekday(1, 2); // 2 minggu lalu (Senin)
  const pastMonday1w = prevWeekday(1, 1); // minggu lalu (Senin)
  const nextMonday   = nextWeekday(1);
  const nextTuesday  = nextWeekday(2);
  const nextWednesday = nextWeekday(3);

  // ── Appointments ──────────────────────────────────────────────────────────
  const appointments = await Appointment.insertMany([
    // completed: Budi → Ahmad (2 minggu lalu)
    {
      patientId: budi._id, doctorId: ahmadProfile._id,
      date: pastMonday2w, timeSlot: '08:00', queueNumber: 1,
      status: 'completed', notes: 'Kepala pusing, tengkuk berat, tekanan darah tinggi'
    },
    // completed: Budi → Ahmad (minggu lalu)
    {
      patientId: budi._id, doctorId: ahmadProfile._id,
      date: pastMonday1w, timeSlot: '08:00', queueNumber: 1,
      status: 'completed', notes: 'Kontrol hipertensi, cek hasil lab'
    },
    // confirmed: Budi → Ahmad (Senin depan)
    {
      patientId: budi._id, doctorId: ahmadProfile._id,
      date: nextMonday, timeSlot: '09:00', queueNumber: 2,
      status: 'confirmed', notes: 'Kontrol rutin bulanan'
    },
    // pending: Siti → Dewi (Selasa depan)
    {
      patientId: siti._id, doctorId: dewiProfile._id,
      date: nextTuesday, timeSlot: '09:00', queueNumber: 1,
      status: 'pending', notes: 'Anak demam 3 hari, batuk pilek'
    },
    // pending: Budi → Reza (Rabu depan)
    {
      patientId: budi._id, doctorId: rezaProfile._id,
      date: nextWednesday, timeSlot: '13:00', queueNumber: 1,
      status: 'pending', notes: 'Konsultasi umum'
    },
    // cancelled: Siti → Ahmad (minggu lalu)
    {
      patientId: siti._id, doctorId: ahmadProfile._id,
      date: pastMonday1w, timeSlot: '08:30', queueNumber: 2,
      status: 'cancelled', notes: 'Demam dan sakit kepala'
    }
  ]);
  const [appt1, appt2] = appointments;
  console.log('Appointments dibuat');

  // ── Medical Records ───────────────────────────────────────────────────────
  await MedicalRecord.insertMany([
    {
      appointmentId: appt1._id,
      patientId: budi._id,
      doctorId: ahmadProfile._id,
      clinicName: 'Klinik Pratama Sehat Sejahtera',
      date: pastMonday2w,
      time: '08:00',
      chiefComplaint: 'Kepala pusing, tengkuk berat, tekanan darah tinggi',
      diagnosis: 'Hipertensi Grade I',
      symptoms: ['pusing', 'tengkuk berat', 'pandangan kabur'],
      vitalSigns: { bloodPressure: '150/90', heartRate: 82, temperature: 36.8, weight: 72, height: 170 },
      treatment: 'Pemberian antihipertensi, edukasi diet rendah garam dan olahraga teratur',
      prescription: [
        { name: 'Amlodipine',  dosage: '5 mg', frequency: '1x sehari',         duration: '30 hari' },
        { name: 'Candesartan', dosage: '8 mg', frequency: '1x sehari',         duration: '30 hari' }
      ],
      notes: 'Pasien disarankan kontrol 2 minggu lagi untuk evaluasi tekanan darah',
      followUpDate: pastMonday1w
    },
    {
      appointmentId: appt2._id,
      patientId: budi._id,
      doctorId: ahmadProfile._id,
      clinicName: 'Klinik Pratama Sehat Sejahtera',
      date: pastMonday1w,
      time: '08:00',
      chiefComplaint: 'Kontrol hipertensi, kolesterol tinggi dari hasil lab',
      diagnosis: 'Hipertensi Grade I terkontrol, Dislipidemia',
      symptoms: ['pusing ringan', 'mudah lelah'],
      vitalSigns: { bloodPressure: '135/85', heartRate: 78, temperature: 36.6, weight: 71, height: 170 },
      treatment: 'Lanjut antihipertensi, tambah statin untuk kolesterol, diet rendah lemak',
      prescription: [
        { name: 'Amlodipine',  dosage: '5 mg',  frequency: '1x sehari',        duration: '30 hari' },
        { name: 'Candesartan', dosage: '8 mg',  frequency: '1x sehari',        duration: '30 hari' },
        { name: 'Simvastatin', dosage: '20 mg', frequency: '1x sehari (malam)',duration: '30 hari' }
      ],
      notes: 'Tekanan darah mulai terkontrol. Periksa laboratorium lengkap bulan depan.',
      followUpDate: nextMonday
    }
  ]);
  console.log('Medical records dibuat');

  console.log('\n✅ Seed selesai!');
  console.log('─'.repeat(44));
  console.log('Akun demo (password: password123)');
  console.log('  Patient : budi@test.com');
  console.log('  Patient : siti@test.com');
  console.log('  Doctor  : ahmad@test.com  (Sp.PD, BPJS)');
  console.log('  Doctor  : dewi@test.com   (Sp.A,  BPJS)');
  console.log('  Doctor  : reza@test.com   (Sp.OG, umum)');
  console.log('  Admin   : admin@test.com');
  console.log('─'.repeat(44));

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  mongoose.disconnect();
  process.exit(1);
});
