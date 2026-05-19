const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DoctorProfile',
    required: true,
    index: true
  },
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6 // 0=Minggu, 1=Senin, ..., 6=Sabtu
  },
  startTime: {
    type: String,
    required: true // format HH:MM
  },
  endTime: {
    type: String,
    required: true // format HH:MM
  },
  slotDuration: {
    type: Number,
    default: 30 // dalam menit
  },
  maxPatients: {
    type: Number,
    default: 20
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', ScheduleSchema);
