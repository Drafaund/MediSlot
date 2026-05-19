const DoctorProfile = require('../models/DoctorProfile');

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
      .sort({ rating: -1 });

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
    const profile = await DoctorProfile.findOneAndUpdate(
      { userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profil tidak ditemukan' });
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

module.exports = { getDoctors, getDoctor, createProfile, updateProfile, getMyProfile };
