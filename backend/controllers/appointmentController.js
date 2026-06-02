const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const Schedule = require('../models/Schedule');

// Helper: hitung queue number untuk dokter di tanggal tertentu
const generateQueueNumber = async (doctorId, date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const count = await Appointment.countDocuments({
    doctorId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $ne: 'cancelled' }
  });
  return count + 1;
};

// @desc  Buat appointment baru (booking)
// @route POST /api/appointments
// @access Private (patient)
const createAppointment = async (req, res) => {
  try {
    const { doctorId, date, timeSlot, notes } = req.body;

    if (!doctorId || !date || !timeSlot) {
      return res.status(400).json({ success: false, message: 'doctorId, date, dan timeSlot wajib diisi' });
    }

    // Pastikan dokter exist dan terverifikasi
    const doctor = await DoctorProfile.findById(doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: 'Dokter tidak ditemukan' });
    if (!doctor.isVerified) return res.status(400).json({ success: false, message: 'Dokter belum terverifikasi' });

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    // Pastikan dokter punya jadwal aktif di hari tersebut
    const schedule = await Schedule.findOne({ doctorId, dayOfWeek, isActive: true });
    if (!schedule) {
      return res.status(400).json({ success: false, message: 'Dokter tidak praktik di hari tersebut' });
    }

    // Cek apakah slot sudah dipesan
    const startOfDay = new Date(targetDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate); endOfDay.setHours(23, 59, 59, 999);

    const slotTaken = await Appointment.findOne({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      timeSlot,
      status: { $ne: 'cancelled' }
    });
    if (slotTaken) {
      return res.status(400).json({ success: false, message: 'Slot waktu tersebut sudah dipesan' });
    }

    // Cek apakah pasien sudah punya appointment aktif di hari dan dokter yang sama
    const existingAppointment = await Appointment.findOne({
      patientId: req.user._id,
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed'] }
    });
    if (existingAppointment) {
      return res.status(400).json({ success: false, message: 'Anda sudah memiliki appointment dengan dokter ini di hari yang sama' });
    }

    const queueNumber = await generateQueueNumber(doctorId, targetDate);

    const appointment = await Appointment.create({
      patientId: req.user._id,
      doctorId,
      date: targetDate,
      timeSlot,
      queueNumber,
      notes: notes || '',
      status: 'pending'
    });

    const populated = await appointment.populate([
      { path: 'patientId', select: 'name email phone avatar' },
      { path: 'doctorId', select: 'specialization clinicName clinicAddress consultationFee', populate: { path: 'userId', select: 'name avatar' } }
    ]);

    res.status(201).json({ success: true, data: populated, message: 'Appointment berhasil dibuat' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Riwayat appointment pasien yang login
// @route GET /api/appointments/my
// @access Private (patient)
const getMyAppointments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { patientId: req.user._id };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate({
          path: 'doctorId',
          select: 'specialization clinicName clinicAddress consultationFee city',
          populate: { path: 'userId', select: 'name avatar' }
        })
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Appointment.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: appointments,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  List appointment untuk dokter (hari ini atau berdasarkan tanggal)
// @route GET /api/appointments/doctor?date=YYYY-MM-DD
// @access Private (doctor)
const getDoctorAppointments = async (req, res) => {
  try {
    const doctorProfile = await DoctorProfile.findOne({ userId: req.user._id });
    if (!doctorProfile) return res.status(404).json({ success: false, message: 'Profil dokter tidak ditemukan' });

    const { date, status, page = 1, limit = 20 } = req.query;

    // Default ke hari ini jika tidak ada query date
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate); endOfDay.setHours(23, 59, 59, 999);

    const filter = {
      doctorId: doctorProfile._id,
      date: { $gte: startOfDay, $lte: endOfDay }
    };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate('patientId', 'name email phone avatar')
        .sort({ queueNumber: 1 })
        .skip(skip)
        .limit(Number(limit)),
      Appointment.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: appointments,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Update status appointment (confirmed/cancelled/completed)
// @route PUT /api/appointments/:id/status
// @access Private (doctor untuk confirmed/completed, patient untuk cancelled)
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['confirmed', 'cancelled', 'completed'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Status harus salah satu dari: ${validStatuses.join(', ')}` });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment tidak ditemukan' });

    // Tentukan izin berdasarkan role
    if (req.user.role === 'patient') {
      // Pasien hanya bisa cancel appointment miliknya sendiri yang masih pending/confirmed
      if (appointment.patientId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Akses ditolak' });
      }
      if (status !== 'cancelled') {
        return res.status(403).json({ success: false, message: 'Pasien hanya bisa membatalkan appointment' });
      }
      if (!['pending', 'confirmed'].includes(appointment.status)) {
        return res.status(400).json({ success: false, message: 'Appointment tidak dapat dibatalkan' });
      }
    } else if (req.user.role === 'doctor') {
      // Dokter hanya bisa update appointment miliknya
      const doctorProfile = await DoctorProfile.findOne({ userId: req.user._id });
      if (!doctorProfile || appointment.doctorId.toString() !== doctorProfile._id.toString()) {
        return res.status(403).json({ success: false, message: 'Akses ditolak' });
      }
      // Dokter tidak bisa set ulang ke pending
      if (appointment.status === 'completed' || appointment.status === 'cancelled') {
        return res.status(400).json({ success: false, message: `Appointment berstatus '${appointment.status}' tidak dapat diubah` });
      }
    } else {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    appointment.status = status;
    await appointment.save();

    const updated = await appointment.populate([
      { path: 'patientId', select: 'name email phone avatar' },
      { path: 'doctorId', select: 'specialization clinicName', populate: { path: 'userId', select: 'name' } }
    ]);

    res.json({ success: true, data: updated, message: `Status appointment berhasil diubah menjadi '${status}'` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get single appointment by ID
// @route GET /api/appointments/:id
// @access Private (patient bersangkutan atau dokter yang menangani)
const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'name email phone avatar')
      .populate({
        path: 'doctorId',
        select: 'specialization clinicName consultationFee',
        populate: { path: 'userId', select: 'name avatar' }
      });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment tidak ditemukan' });
    }

    // Pasien hanya bisa lihat appointment miliknya
    if (req.user.role === 'patient' && appointment.patientId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    // Dokter hanya bisa lihat appointment miliknya
    if (req.user.role === 'doctor') {
      const DoctorProfile = require('../models/DoctorProfile');
      const profile = await DoctorProfile.findOne({ userId: req.user._id });
      if (!profile || appointment.doctorId._id.toString() !== profile._id.toString()) {
        return res.status(403).json({ success: false, message: 'Akses ditolak' });
      }
    }

    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createAppointment, getMyAppointments, getDoctorAppointments, updateAppointmentStatus, getAppointmentById };
