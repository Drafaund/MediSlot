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
          content: `Kamu adalah asisten kesehatan digital untuk platform MediSlot di Indonesia.
Berdasarkan gejala, durasi, dan kelompok usia pasien, rekomendasikan 2-3 spesialisasi dokter yang paling tepat.
PENTING: Ini hanya panduan awal untuk membantu pasien memilih dokter, BUKAN diagnosa medis.

Jawab HANYA dalam format JSON berikut:
{
  "explanation": "penjelasan 2-3 kalimat tentang kemungkinan kondisi pasien berdasarkan gejala, durasi, dan usia — gunakan bahasa awam yang hangat",
  "recs": [
    {"spec": "nama spesialisasi", "conf": 85, "why": "alasan singkat mengapa spesialisasi ini relevan"},
    {"spec": "nama spesialisasi 2", "conf": 70, "why": "alasan singkat"}
  ],
  "urgency": "rendah|sedang|tinggi",
  "disclaimer": "pesan singkat bahwa ini bukan diagnosa medis"
}`
        },
        { role: 'user', content: userPrompt }
      ]
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    res.json({ success: true, data: parsed });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
          overview: 'Belum ada riwayat medis yang tersimpan. Ringkasan kesehatan akan tersedia setelah Anda memiliki rekam medis dari kunjungan dokter.',
          chronicConditions: [],
          ongoingMedications: [],
          patterns: [],
          recommendations: [],
          recordCount: 0
        }
      });
    }

    const recordsText = records.map((r, idx) => {
      const doctorName = r.doctorId?.userId?.name ?? 'Tidak diketahui';
      const specialization = r.doctorId?.specialization ?? '';
      const date = new Date(r.date).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
      const complaint = r.chiefComplaint || r.symptoms.join(', ') || 'Tidak dicatat';
      const drugs = r.prescription.length > 0
        ? r.prescription.map(p => `${p.name} (${p.dosage}, ${p.frequency})`).join(', ')
        : 'Tidak ada resep';

      const vitalParts = [];
      if (r.vitalSigns?.bloodPressure) vitalParts.push(`TD: ${r.vitalSigns.bloodPressure}`);
      if (r.vitalSigns?.heartRate)     vitalParts.push(`Nadi: ${r.vitalSigns.heartRate} bpm`);
      if (r.vitalSigns?.temperature)   vitalParts.push(`Suhu: ${r.vitalSigns.temperature}°C`);
      if (r.vitalSigns?.weight)        vitalParts.push(`BB: ${r.vitalSigns.weight} kg`);
      const vitals = vitalParts.length > 0 ? vitalParts.join(', ') : 'Tidak dicatat';

      const followUp = r.followUpDate
        ? `Kontrol ulang: ${new Date(r.followUpDate).toLocaleDateString('id-ID')}`
        : '';

      return `[${idx + 1}] ${date} — ${r.clinicName} | Dr. ${doctorName}${specialization ? ` (${specialization})` : ''}
   Keluhan: ${complaint}
   Diagnosa: ${r.diagnosis}
   Tanda Vital: ${vitals}
   Pengobatan: ${r.treatment || 'Tidak dicatat'}
   Resep: ${drugs}${followUp ? `\n   ${followUp}` : ''}`;
    }).join('\n\n');

    const response = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Kamu adalah asisten kesehatan digital untuk platform MediSlot.
Buat ringkasan kondisi kesehatan pasien berdasarkan riwayat rekam medisnya dalam Bahasa Indonesia yang hangat dan mudah dipahami orang awam.

Jawab HANYA dalam format JSON berikut (tanpa teks di luar JSON):
{
  "overview": "ringkasan 2-3 kalimat tentang kondisi kesehatan pasien secara keseluruhan dan perkembangannya",
  "monitoredConditions": ["kondisi atau diagnosis yang muncul lebih dari sekali dan perlu dipantau — kosongkan array ini jika semua kunjungan bersifat akut/sesaat"],
  "ongoingMedications": ["nama obat (dosis, frekuensi) yang masih diresepkan"],
  "patterns": ["pola kesehatan yang terdeteksi dari kunjungan, misalnya tren membaik/memburuk"],
  "recommendations": ["saran praktis 1", "saran praktis 2", "saran praktis 3"]
}

Aturan:
- overview: 2-3 kalimat, bahasa awam
- monitoredConditions: HANYA isi jika kondisi muncul di lebih dari 1 kunjungan dan butuh pemantauan rutin. Penyakit akut seperti flu, ISPA, demam biasa JANGAN dimasukkan. Maks 4 item, atau array kosong []
- ongoingMedications: ambil dari resep terakhir, maks 5 item
- patterns: maks 3 item
- recommendations: tepat 3 item, konkret dan actionable
- Jangan gunakan istilah medis yang terlalu teknis`
        },
        {
          role: 'user',
          content: `Berikut riwayat medis pasien (${records.length} kunjungan terakhir):\n\n${recordsText}`
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
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { symptomCheck, healthSummary };
