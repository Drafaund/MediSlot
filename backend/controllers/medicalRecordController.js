const MedicalRecord = require('../models/MedicalRecord');
const Appointment   = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');

// Helper: ambil DoctorProfile dari userId, lempar error jika tidak ada
const getDoctorProfileOrFail = async (userId) => {
  const profile = await DoctorProfile.findOne({ userId });
  if (!profile) throw { status: 404, message: 'Profil dokter tidak ditemukan' };
  return profile;
};

// Helper: verifikasi rekam medis bisa diakses oleh user yang meminta
// Pasien: hanya miliknya sendiri
// Dokter: hanya pasien yang pernah ditanganinya
const assertRecordAccess = async (record, user) => {
  if (user.role === 'patient') {
    if (record.patientId.toString() !== user._id.toString()) {
      throw { status: 403, message: 'Akses ditolak' };
    }
  } else if (user.role === 'doctor') {
    const profile = await getDoctorProfileOrFail(user._id);
    if (record.doctorId.toString() !== profile._id.toString()) {
      throw { status: 403, message: 'Akses ditolak — bukan pasien Anda' };
    }
  } else {
    throw { status: 403, message: 'Akses ditolak' };
  }
};

// @desc  Dokter input rekam medis dari appointment yang sudah completed
// @route POST /api/medical-records
// @access Private (doctor)
const createMedicalRecord = async (req, res) => {
  try {
    const {
      appointmentId,
      chiefComplaint,
      diagnosis,
      symptoms,
      vitalSigns,
      treatment,
      prescription,
      notes,
      followUpDate
    } = req.body;

    if (!appointmentId || !diagnosis) {
      return res.status(400).json({ success: false, message: 'appointmentId dan diagnosis wajib diisi' });
    }

    const doctorProfile = await DoctorProfile.findOne({ userId: req.user._id });
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Profil dokter tidak ditemukan' });
    }

    // Pastikan appointment ada dan milik dokter ini
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment tidak ditemukan' });
    }
    if (appointment.doctorId.toString() !== doctorProfile._id.toString()) {
      return res.status(403).json({ success: false, message: 'Akses ditolak — bukan appointment Anda' });
    }
    if (appointment.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Rekam medis hanya bisa dibuat untuk appointment yang sudah completed' });
    }

    // Cegah duplikat — 1 appointment : 1 rekam medis
    const existing = await MedicalRecord.findOne({ appointmentId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Rekam medis untuk appointment ini sudah ada' });
    }

    const record = await MedicalRecord.create({
      appointmentId,
      patientId: appointment.patientId,
      doctorId: doctorProfile._id,
      clinicName: doctorProfile.clinicName,
      date: appointment.date,
      time: appointment.timeSlot,
      chiefComplaint: chiefComplaint || appointment.notes || '',
      diagnosis,
      symptoms: symptoms || [],
      vitalSigns: vitalSigns || {},
      treatment: treatment || '',
      prescription: prescription || [],
      notes: notes || '',
      followUpDate: followUpDate || null
    });

    const populated = await record.populate([
      { path: 'patientId', select: 'name email phone avatar' },
      { path: 'doctorId', select: 'specialization clinicName', populate: { path: 'userId', select: 'name avatar' } },
      { path: 'appointmentId', select: 'date timeSlot queueNumber' }
    ]);

    res.status(201).json({ success: true, data: populated, message: 'Rekam medis berhasil disimpan' });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// @desc  Pasien lihat riwayat rekam medis sendiri (kronologis)
// @route GET /api/medical-records/my
// @access Private (patient)
const getMyMedicalRecords = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { patientId: req.user._id };

    const [records, total] = await Promise.all([
      MedicalRecord.find(filter)
        .populate({
          path: 'doctorId',
          select: 'specialization clinicName city',
          populate: { path: 'userId', select: 'name avatar' }
        })
        .populate('appointmentId', 'date timeSlot queueNumber status')
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit)),
      MedicalRecord.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: records,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Dokter lihat rekam medis yang DIA buat untuk pasien tertentu
// @route GET /api/medical-records/patient/:patientId
// @access Private (doctor)
const getPatientMedicalRecords = async (req, res) => {
  try {
    const doctorProfile = await DoctorProfile.findOne({ userId: req.user._id });
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Profil dokter tidak ditemukan' });
    }

    // Akses diizinkan jika dokter punya appointment (status apapun) dengan pasien ini
    const hasAppointment = await Appointment.exists({
      doctorId: doctorProfile._id,
      patientId: req.params.patientId
    });
    if (!hasAppointment) {
      return res.status(403).json({ success: false, message: 'Akses ditolak — pasien ini belum pernah Anda tangani' });
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Hanya rekam medis yang dibuat oleh dokter ini untuk pasien ini
    const filter = {
      patientId: req.params.patientId,
      doctorId: doctorProfile._id
    };

    const [records, total] = await Promise.all([
      MedicalRecord.find(filter)
        .populate('appointmentId', 'date timeSlot status')
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit)),
      MedicalRecord.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: records,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Detail satu rekam medis
// @route GET /api/medical-records/:id
// @access Private (patient bersangkutan atau dokter yang menangani)
const getMedicalRecordById = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate('patientId', 'name email phone avatar')
      .populate({
        path: 'doctorId',
        select: 'specialization clinicName clinicAddress consultationFee licenseNumber',
        populate: { path: 'userId', select: 'name avatar' }
      })
      .populate('appointmentId', 'date timeSlot queueNumber status notes');

    if (!record) {
      return res.status(404).json({ success: false, message: 'Rekam medis tidak ditemukan' });
    }

    await assertRecordAccess(record, req.user);

    res.json({ success: true, data: record });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

module.exports = {
  createMedicalRecord,
  getMyMedicalRecords,
  getPatientMedicalRecords,
  getMedicalRecordById
};
