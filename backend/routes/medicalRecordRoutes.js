const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createMedicalRecord,
  getMyMedicalRecords,
  getPatientMedicalRecords,
  getMedicalRecordById,
  getMedicalRecordByAppointment
} = require('../controllers/medicalRecordController');

// Urutan penting: route statis (/my, /patient/:id, /appointment/:id) harus di atas route dinamis (/:id)
router.post('/', protect, authorize('doctor'), createMedicalRecord);
router.get('/my', protect, authorize('patient'), getMyMedicalRecords);
router.get('/patient/:patientId', protect, authorize('doctor'), getPatientMedicalRecords);
router.get('/appointment/:appointmentId', protect, authorize('patient', 'doctor'), getMedicalRecordByAppointment);
router.get('/:id', protect, authorize('patient', 'doctor'), getMedicalRecordById);

module.exports = router;
