const Groq = require('groq-sdk');
const MedicalRecord = require('../models/MedicalRecord');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

// @desc  Cek gejala dan rekomendasikan spesialisasi dokter
// @route POST /api/ai/symptom-check
// @access Private
const symptomCheck = async (req, res) => {
  try {
    const { symptoms, duration, ageGroup } = req.body;

    if (!symptoms || !symptoms.trim()) {
      return res.status(400).json({ success: false, message: 'Gejala wajib diisi' });
    }

    const userPrompt = [
      `Gejala: ${symptoms.trim()}`,
      duration ? `Durasi gejala: ${duration}` : null,
      ageGroup ? `Kelompok usia: ${ageGroup}` : null,
    ].filter(Boolean).join('\n');

    const response = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a digital health assistant for the MediSlot platform in Indonesia.
Based on the patient's symptoms, duration, and age group, recommend 2-3 most appropriate doctor specializations.
IMPORTANT: This is only an initial guide to help patients choose a doctor, NOT a medical diagnosis.

Respond ONLY in the following JSON format:
{
  "explanation": "2-3 sentence explanation of the patient's possible condition based on symptoms, duration, and age — use warm, plain language",
  "recs": [
    {"spec": "specialization name", "conf": 85, "why": "brief reason why this specialization is relevant"},
    {"spec": "specialization name 2", "conf": 70, "why": "brief reason"}
  ],
  "urgency": "low|medium|high",
  "disclaimer": "short message that this is not a medical diagnosis"
}`
        },
        { role: 'user', content: userPrompt }
      ]
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    res.json({ success: true, data: parsed });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Server error' : error.message });
  }
};

// @desc  Buat ringkasan kondisi kesehatan pasien dari riwayat rekam medis
// @route GET /api/ai/health-summary
// @access Private (patient)
const healthSummary = async (req, res) => {
  try {
    const records = await MedicalRecord.find({ patientId: req.user._id })
      .populate({
        path: 'doctorId',
        select: 'specialization clinicName',
        populate: { path: 'userId', select: 'name' }
      })
      .sort({ date: -1 })
      .limit(20);

    if (records.length === 0) {
      return res.json({
        success: true,
        data: {
          overview: 'No medical history found. Your health summary will be available once you have medical records from a doctor visit.',
          chronicConditions: [],
          ongoingMedications: [],
          patterns: [],
          recommendations: [],
          recordCount: 0
        }
      });
    }

    const recordsText = records.map((r, idx) => {
      const doctorName = r.doctorId?.userId?.name ?? 'Unknown';
      const specialization = r.doctorId?.specialization ?? '';
      const date = new Date(r.date).toLocaleDateString('en-US', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
      const complaint = r.chiefComplaint || r.symptoms.join(', ') || 'Not recorded';
      const drugs = r.prescription.length > 0
        ? r.prescription.map(p => `${p.name} (${p.dosage}, ${p.frequency})`).join(', ')
        : 'No prescription';

      const vitalParts = [];
      if (r.vitalSigns?.bloodPressure) vitalParts.push(`BP: ${r.vitalSigns.bloodPressure}`);
      if (r.vitalSigns?.heartRate)     vitalParts.push(`HR: ${r.vitalSigns.heartRate} bpm`);
      if (r.vitalSigns?.temperature)   vitalParts.push(`Temp: ${r.vitalSigns.temperature}°C`);
      if (r.vitalSigns?.weight)        vitalParts.push(`Weight: ${r.vitalSigns.weight} kg`);
      const vitals = vitalParts.length > 0 ? vitalParts.join(', ') : 'Not recorded';

      const followUp = r.followUpDate
        ? `Follow-up: ${new Date(r.followUpDate).toLocaleDateString('en-US')}`
        : '';

      return `[${idx + 1}] ${date} — ${r.clinicName} | Dr. ${doctorName}${specialization ? ` (${specialization})` : ''}
   Complaint: ${complaint}
   Diagnosis: ${r.diagnosis}
   Vital Signs: ${vitals}
   Treatment: ${r.treatment || 'Not recorded'}
   Prescription: ${drugs}${followUp ? `\n   ${followUp}` : ''}`;
    }).join('\n\n');

    const response = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a digital health assistant for the MediSlot platform.
Create a health summary for the patient based on their medical history in warm, plain English that is easy for a layperson to understand.

Respond ONLY in the following JSON format (no text outside JSON):
{
  "overview": "2-3 sentence summary of the patient's overall health condition and its progress",
  "monitoredConditions": ["condition or diagnosis that appears more than once and needs monitoring — leave this array empty if all visits are acute/one-time"],
  "ongoingMedications": ["medication name (dose, frequency) still being prescribed"],
  "patterns": ["health patterns detected from visits, e.g. improving or worsening trends"],
  "recommendations": ["practical advice 1", "practical advice 2", "practical advice 3"]
}

Rules:
- overview: 2-3 sentences, plain language
- monitoredConditions: ONLY include if a condition appears in more than 1 visit and requires routine monitoring. Acute conditions like flu, cold, or fever SHOULD NOT be included. Max 4 items, or empty array []
- ongoingMedications: take from most recent prescription, max 5 items
- patterns: max 3 items
- recommendations: exactly 3 items, concrete and actionable
- Avoid overly technical medical terminology`
        },
        {
          role: 'user',
          content: `Here is the patient's medical history (last ${records.length} visits):\n\n${recordsText}`
        }
      ]
    });

    const parsed = JSON.parse(response.choices[0].message.content);

    res.json({
      success: true,
      data: {
        overview:            parsed.overview            || '',
        chronicConditions:   parsed.monitoredConditions || parsed.chronicConditions || [],
        ongoingMedications:  parsed.ongoingMedications  || [],
        patterns:            parsed.patterns             || [],
        recommendations:     parsed.recommendations      || [],
        recordCount: records.length,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Server error' : error.message });
  }
};

module.exports = { symptomCheck, healthSummary };
