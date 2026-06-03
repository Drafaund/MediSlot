const express = require('express');
const router = express.Router();
const { getAvailableSlots, createSchedule, getSchedules, updateSchedule } = require('../controllers/scheduleController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/:doctorId/slots', getAvailableSlots);
router.get('/:doctorId', getSchedules);
router.post('/', protect, authorize('doctor'), createSchedule);
router.put('/:id', protect, authorize('doctor'), updateSchedule);

module.exports = router;
