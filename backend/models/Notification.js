const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['booking_new', 'appointment_confirmed', 'appointment_cancelled', 'appointment_cancelled_patient', 'appointment_cancelled_doctor', 'appointment_completed', 'record_created'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  relatedId: { type: mongoose.Schema.Types.ObjectId, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
