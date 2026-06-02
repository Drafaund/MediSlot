const express = require('express');
const router = express.Router();
const {
  register, login,
  googleAuth, googleCallback, googleCallbackMiddleware,
  getMe, updateProfile
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/google', googleAuth);
router.get('/google/callback', googleCallbackMiddleware, googleCallback);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;
