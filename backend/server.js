const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const passport = require('passport');
const connectDB = require('./config/db');

dotenv.config();

// Passport config (Google OAuth)
require('./config/passport');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
const allowedOrigin = (process.env.CLIENT_URL || 'http://localhost:3000').trim().replace(/\/$/, '');
app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));
app.use(express.json());
app.use(passport.initialize());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/schedules', require('./routes/scheduleRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/medical-records', require('./routes/medicalRecordRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

// Health check
app.get('/', (req, res) => {
  res.json({ success: true, message: 'MediSlot API is running' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route tidak ditemukan' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
