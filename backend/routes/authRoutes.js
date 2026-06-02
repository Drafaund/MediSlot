const express = require('express');
const passport = require('passport');
const router = express.Router();
const {
  register, login,
  googleAuth, googleCallback, googleCallbackMiddleware,
  getMe, updateProfile, getAllUsers, deleteUser
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/google', (req, res, next) => {
  const role = ['doctor', 'patient'].includes(req.query.role) ? req.query.role : 'patient';
  passport.authenticate('google', { scope: ['profile', 'email'], state: role })(req, res, next);
});
router.get('/google/callback', googleCallbackMiddleware, googleCallback);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/admin/users', protect, authorize('admin'), getAllUsers);
router.delete('/admin/users/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
