const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');

// Helper: generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc  Register user baru
// @route POST /api/auth/register
// @access Public
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Nama, email, dan password wajib diisi' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
    }

    // Hanya izinkan role patient atau doctor saat register publik
    const allowedRole = ['patient', 'doctor'].includes(role) ? role : 'patient';

    const user = await User.create({ name, email, password, role: allowedRole });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      },
      token
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Login user
// @route POST /api/auth/login
// @access Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi' });
    }

    // Ambil password (select: false di model)
    const user = await User.findOne({ email }).select('+password');

    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      },
      token
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Redirect ke Google OAuth
// @route GET /api/auth/google
// @access Public
const googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

// @desc  Google OAuth callback
// @route GET /api/auth/google/callback
// @access Public
const googleCallback = async (req, res) => {
  try {
    const token = generateToken(req.user._id);
    // Redirect ke frontend dengan token di query param
    res.redirect(`${process.env.CLIENT_URL}/auth/google/success?token=${token}`);
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL}/login?error=google_auth_failed`);
  }
};

// Middleware passport untuk callback
const googleCallbackMiddleware = passport.authenticate('google', {
  session: false,
  failureRedirect: `${process.env.CLIENT_URL}/login?error=google_auth_failed`
});

// @desc  Get current user
// @route GET /api/auth/me
// @access Private
const getMe = async (req, res) => {
  try {
    res.json({ success: true, data: req.user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Update patient profile (nama, telepon, tanggal lahir, gender, gol. darah, alergi)
// @route PUT /api/auth/profile
// @access Private
const updateProfile = async (req, res) => {
  try {
    const { name, phone, dateOfBirth, gender, bloodType, allergies } = req.body;

    const allowed = {};
    if (name)        allowed.name        = name.trim();
    if (phone !== undefined) allowed.phone = phone;
    if (dateOfBirth !== undefined) allowed.dateOfBirth = dateOfBirth || null;
    if (gender !== undefined)      allowed.gender      = gender;
    if (bloodType !== undefined)   allowed.bloodType   = bloodType;
    if (allergies !== undefined)   allowed.allergies   = Array.isArray(allergies) ? allergies.filter(Boolean) : [];

    const user = await User.findByIdAndUpdate(
      req.user._id,
      allowed,
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: user, message: 'Profil berhasil diperbarui' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Delete a patient account (admin only)
// @route DELETE /api/auth/admin/users/:id
// @access Private (admin)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    if (user.role !== 'patient') {
      return res.status(403).json({ success: false, message: 'Hanya akun pasien yang dapat dihapus' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: `Akun ${user.name} berhasil dihapus` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get all users (admin only)
// @route GET /api/auth/admin/users
// @access Private (admin)
const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, googleAuth, googleCallback, googleCallbackMiddleware, getMe, updateProfile, getAllUsers, deleteUser };
