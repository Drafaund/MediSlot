const express = require('express');
const router = express.Router();
const { getAvailableSlots, createSchedule, getSchedules } = require('../controllers/scheduleController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/:doctorId/slots', getAvailableSlots);
router.get('/:doctorId', getSchedules);
router.post('/', protect, authorize('doctor'), createSchedule);

module.exports = router;
