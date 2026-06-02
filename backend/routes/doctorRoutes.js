const express = require('express');
const router = express.Router();
const { getDoctors, getDoctor, createProfile, updateProfile, getMyProfile, getAllDoctorsAdmin, verifyDoctor } = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getDoctors);
router.get('/admin/all', protect, authorize('admin'), getAllDoctorsAdmin);
router.get('/my-profile', protect, authorize('doctor'), getMyProfile);
router.get('/:id', getDoctor);
router.post('/profile', protect, authorize('doctor'), createProfile);
router.put('/profile', protect, authorize('doctor'), updateProfile);
router.put('/:id/verify', protect, authorize('admin'), verifyDoctor);

module.exports = router;
