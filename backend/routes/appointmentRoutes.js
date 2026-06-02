const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createAppointment,
  getMyAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  getAppointmentById
} = require('../controllers/appointmentController');

router.post('/', protect, authorize('patient'), createAppointment);
router.get('/my', protect, authorize('patient'), getMyAppointments);
router.get('/doctor', protect, authorize('doctor'), getDoctorAppointments);
router.get('/:id', protect, getAppointmentById);
router.put('/:id/status', protect, authorize('patient', 'doctor'), updateAppointmentStatus);

module.exports = router;
