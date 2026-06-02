const Notification = require('../models/Notification');

const TEMPLATES = {
  booking_new: (patientName) => ({
    title: 'Booking baru masuk',
    message: `${patientName} baru saja melakukan booking appointment dengan Anda.`,
  }),
  appointment_confirmed: (doctorName) => ({
    title: 'Appointment dikonfirmasi',
    message: `Appointment Anda dengan ${doctorName} telah dikonfirmasi.`,
  }),
  appointment_cancelled_patient: (patientName) => ({
    title: 'Appointment dibatalkan',
    message: `${patientName} membatalkan appointment dengan Anda.`,
  }),
  appointment_cancelled_doctor: (doctorName) => ({
    title: 'Appointment dibatalkan',
    message: `Appointment Anda dengan ${doctorName} telah dibatalkan.`,
  }),
  appointment_completed: (doctorName) => ({
    title: 'Konsultasi selesai',
    message: `Konsultasi Anda dengan ${doctorName} telah selesai. Rekam medis akan segera tersedia.`,
  }),
  record_created: (doctorName) => ({
    title: 'Rekam medis tersedia',
    message: `${doctorName} telah menginput rekam medis dari kunjungan Anda.`,
  }),
};

const createNotif = async ({ userId, type, templateArgs, relatedId }) => {
  try {
    const { title, message } = TEMPLATES[type](...templateArgs);
    await Notification.create({ userId, type, title, message, relatedId });
  } catch {
    // Notifikasi gagal tidak boleh ganggu flow utama
  }
};

module.exports = createNotif;
