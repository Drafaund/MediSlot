const mongoose = require('mongoose');

const DoctorProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  specialization: {
    type: String,
    required: [true, 'Spesialisasi wajib diisi']
  },
  licenseNumber: {
    type: String,
    required: [true, 'Nomor STR wajib diisi']
  },
  clinicName: {
    type: String,
    required: [true, 'Nama klinik wajib diisi']
  },
  clinicAddress: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    required: [true, 'Kota wajib diisi'],
    index: true
  },
  consultationFee: {
    type: Number,
    default: 0
  },
  acceptBPJS: {
    type: Boolean,
    default: false
  },
  bio: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  }
}, { timestamps: true });

// Index untuk pencarian yang sering dilakukan
DoctorProfileSchema.index({ specialization: 'text', clinicName: 'text' });

module.exports = mongoose.model('DoctorProfile', DoctorProfileSchema);
