const mongoose = require('mongoose');

const MedicalRecordSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
    unique: true // 1:1 dengan Appointment
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DoctorProfile',
    required: true
  },
  clinicName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  chiefComplaint: {
    type: String,
    default: '' // keluhan utama
  },
  diagnosis: {
    type: String,
    required: [true, 'Diagnosa wajib diisi']
  },
  symptoms: [{
    type: String
  }],
  vitalSigns: {
    bloodPressure: String,  // contoh: "120/80"
    heartRate: Number,      // bpm
    temperature: Number,    // celsius
    weight: Number,         // kg
    height: Number          // cm
  },
  treatment: {
    type: String,
    default: ''
  },
  prescription: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String
  }],
  notes: {
    type: String,
    default: ''
  },
  followUpDate: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('MedicalRecord', MedicalRecordSchema);
