const express = require('express');
const router = express.Router();
const {
  register, login,
  googleAuth, googleCallback, googleCallbackMiddleware,
  getMe, updateProfile, getAllUsers
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/google', googleAuth);
router.get('/google/callback', googleCallbackMiddleware, googleCallback);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/admin/users', protect, authorize('admin'), getAllUsers);

module.exports = router;
