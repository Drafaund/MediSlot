const express = require('express');
const router = express.Router();
const { getDoctors, getDoctor, createProfile, updateProfile, getMyProfile } = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getDoctors);
router.get('/my-profile', protect, authorize('doctor'), getMyProfile);
router.get('/:id', getDoctor);
router.post('/profile', protect, authorize('doctor'), createProfile);
router.put('/profile', protect, authorize('doctor'), updateProfile);

module.exports = router;
