const Schedule = require('../models/Schedule');
const Appointment = require('../models/Appointment');

// Helper: generate time slots dari schedule
const generateSlots = (schedule, bookedSlots) => {
  const slots = [];
  const [startH, startM] = schedule.startTime.split(':').map(Number);
  const [endH, endM] = schedule.endTime.split(':').map(Number);

  let current = startH * 60 + startM;
  const end = endH * 60 + endM;

  while (current + schedule.slotDuration <= end) {
    const h = Math.floor(current / 60).toString().padStart(2, '0');
    const m = (current % 60).toString().padStart(2, '0');
    const timeStr = `${h}:${m}`;
    if (!bookedSlots.includes(timeStr)) slots.push(timeStr);
    current += schedule.slotDuration;
  }
  return slots;
};

// @desc  Get available slots untuk dokter di tanggal tertentu
// @route GET /api/schedules/:doctorId/slots?date=YYYY-MM-DD
// @access Public
const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) return res.status(400).json({ success: false, message: 'Parameter date wajib diisi' });

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    const schedule = await Schedule.findOne({ doctorId, dayOfWeek, isActive: true });
    if (!schedule) {
      return res.json({ success: true, data: [], message: 'Dokter tidak praktik di hari ini' });
    }

    // Ambil slot yang sudah dipesan
    const startOfDay = new Date(targetDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate); endOfDay.setHours(23, 59, 59, 999);

    const bookedAppointments = await Appointment.find({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' }
    }).select('timeSlot');

    const bookedSlots = bookedAppointments.map(a => a.timeSlot);
    let availableSlots = generateSlots(schedule, bookedSlots);

    // Filter out past slots if the requested date is today (WIB = UTC+7)
    const nowWIB = new Date(Date.now() + 7 * 60 * 60 * 1000);
    const todayWIB = nowWIB.toISOString().slice(0, 10);
    if (date === todayWIB) {
      const currentMinutes = nowWIB.getUTCHours() * 60 + nowWIB.getUTCMinutes();
      availableSlots = availableSlots.filter(slot => {
        const [h, m] = slot.split(':').map(Number);
        return h * 60 + m > currentMinutes;
      });
    }

    res.json({ success: true, data: availableSlots });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Server error' : error.message });
  }
};

// @desc  Create/update schedule
// @route POST /api/schedules
// @access Private (doctor)
const createSchedule = async (req, res) => {
  try {
    const DoctorProfile = require('../models/DoctorProfile');
    const doctorProfile = await DoctorProfile.findOne({ userId: req.user._id });
    if (!doctorProfile) return res.status(404).json({ success: false, message: 'Profil dokter tidak ditemukan' });

    const { dayOfWeek, startTime, endTime, slotDuration, maxPatients, isActive } = req.body;
    const schedule = await Schedule.create({ dayOfWeek, startTime, endTime, slotDuration, maxPatients, isActive, doctorId: doctorProfile._id });
    res.status(201).json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Server error' : error.message });
  }
};

// @desc  Get schedules by doctor
// @route GET /api/schedules/:doctorId
// @access Public
const getSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find({ doctorId: req.params.doctorId, isActive: true });
    res.json({ success: true, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Server error' : error.message });
  }
};

// @desc  Update an existing schedule
// @route PUT /api/schedules/:id
// @access Private (doctor)
const updateSchedule = async (req, res) => {
  try {
    const DoctorProfile = require('../models/DoctorProfile');
    const doctorProfile = await DoctorProfile.findOne({ userId: req.user._id });
    if (!doctorProfile) return res.status(404).json({ success: false, message: 'Profil dokter tidak ditemukan' });

    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan' });
    if (schedule.doctorId.toString() !== doctorProfile._id.toString()) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    const { dayOfWeek, startTime, endTime, slotDuration, maxPatients, isActive } = req.body;
    const updated = await Schedule.findByIdAndUpdate(
      req.params.id,
      { dayOfWeek, startTime, endTime, slotDuration, maxPatients, isActive },
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Server error' : error.message });
  }
};

module.exports = { getAvailableSlots, createSchedule, getSchedules, updateSchedule };
