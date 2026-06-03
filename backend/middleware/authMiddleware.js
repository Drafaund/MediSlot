const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect route — wajib login
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Tidak terotorisasi, token tidak ada' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-googleId -__v');

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User tidak ditemukan' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token tidak valid' });
  }
};

// Authorize role — batasi akses berdasarkan role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' tidak memiliki akses ke resource ini`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
