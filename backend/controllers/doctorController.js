const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');
const createNotif = require('../utils/notify');

// @desc  Get all doctors (search & filter)
// @route GET /api/doctors
// @access Public
const getDoctors = async (req, res) => {
  try {
    const { city, specialization, acceptBPJS, search } = req.query;

    const filter = { isVerified: true };

    if (city) filter.city = new RegExp(city, 'i');
    if (specialization) filter.specialization = new RegExp(specialization, 'i');
    if (acceptBPJS !== undefined) filter.acceptBPJS = acceptBPJS === 'true';
    if (search) {
      filter.$or = [
        { clinicName: new RegExp(search, 'i') },
        { specialization: new RegExp(search, 'i') }
      ];
    }

    const doctors = await DoctorProfile.find(filter)
      .populate('userId', 'name avatar email')
      .sort({ yearsOfExperience: -1, createdAt: -1 });

    res.json({ success: true, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get single doctor
// @route GET /api/doctors/:id
// @access Public
const getDoctor = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findById(req.params.id)
      .populate('userId', 'name avatar email phone');

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Dokter tidak ditemukan' });
    }

    res.json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Create doctor profile
// @route POST /api/doctors/profile
// @access Private (doctor)
const createProfile = async (req, res) => {
  try {
    const existing = await DoctorProfile.findOne({ userId: req.user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Profil dokter sudah ada' });
    }

    const profile = await DoctorProfile.create({
      ...req.body,
      userId: req.user._id
    });

    // Notifikasi ke semua admin: ada dokter baru perlu diverifikasi
    const admins = await User.find({ role: 'admin' }, '_id');
    admins.forEach(admin => {
      createNotif({
        userId: admin._id,
        type: 'doctor_registered',
        templateArgs: [req.user.name],
        relatedId: profile._id
      });
    });

    res.status(201).json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Update doctor profile
// @route PUT /api/doctors/profile
// @access Private (doctor)
const updateProfile = async (req, res) => {
  try {
    // Cek status verifikasi sebelum update
    const existing = await DoctorProfile.findOne({ userId: req.user._id });

    const updateData = { ...req.body };

    // Jika sebelumnya ditolak, ajukan ulang ke antrian verifikasi admin
    const wasRejected = existing?.verificationStatus === 'rejected';
    if (wasRejected) {
      updateData.verificationStatus = 'pending';
      updateData.isVerified = false;
    }

    const profile = await DoctorProfile.findOneAndUpdate(
      { userId: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profil tidak ditemukan' });
    }

    // Notifikasi ulang ke admin jika dokter mengajukan kembali setelah ditolak
    if (wasRejected) {
      const admins = await User.find({ role: 'admin' }, '_id');
      admins.forEach(admin => {
        createNotif({
          userId: admin._id,
          type: 'doctor_registered',
          templateArgs: [req.user.name],
          relatedId: profile._id
        });
      });
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get my doctor profile
// @route GET /api/doctors/my-profile
// @access Private (doctor)
const getMyProfile = async (req, res) => {
  try {
    const profile = await DoctorProfile.findOne({ userId: req.user._id })
      .populate('userId', 'name avatar email phone');

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profil belum dibuat' });
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get all doctors for admin (including unverified)
// @route GET /api/doctors/admin/all
// @access Private (admin)
const getAllDoctorsAdmin = async (req, res) => {
  try {
    const doctors = await DoctorProfile.find({})
      .populate('userId', 'name avatar email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Verify or unverify a doctor
// @route PUT /api/doctors/:id/verify
// @access Private (admin)
const verifyDoctor = async (req, res) => {
  try {
    const { isVerified } = req.body;
    const profile = await DoctorProfile.findByIdAndUpdate(
      req.params.id,
      {
        isVerified,
        verificationStatus: isVerified ? 'verified' : 'rejected'
      },
      { new: true }
    ).populate('userId', 'name avatar email');

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Dokter tidak ditemukan' });
    }

    // Notifikasi ke dokter tentang hasil verifikasi
    createNotif({
      userId: profile.userId,
      type: isVerified ? 'doctor_verified' : 'doctor_rejected',
      templateArgs: [],
      relatedId: profile._id
    });

    res.json({ success: true, data: profile, message: `Dokter berhasil ${isVerified ? 'diverifikasi' : 'dibatalkan verifikasinya'}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDoctors, getDoctor, createProfile, updateProfile, getMyProfile, getAllDoctorsAdmin, verifyDoctor };
