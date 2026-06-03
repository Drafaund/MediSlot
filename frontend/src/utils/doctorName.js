const SPEC_DEGREE = {
  // Indonesian keys (stored by new registrations)
  'Penyakit Dalam':           'Sp.PD',
  'Anak':                     'Sp.A',
  'Kandungan':                'Sp.OG',
  'Bedah Umum':               'Sp.B',
  'Jantung & Pembuluh Darah': 'Sp.JP',
  'Saraf':                    'Sp.S',
  'Mata':                     'Sp.M',
  'THT':                      'Sp.THT',
  'Kulit & Kelamin':          'Sp.KK',
  'Ortopedi':                 'Sp.OT',
  'Urologi':                  'Sp.U',
  'Psikiatri':                'Sp.KJ',
  'Paru':                     'Sp.P',
  // English fallbacks (for existing data / seed doctors)
  'Internal Medicine':        'Sp.PD',
  'Pediatrics':               'Sp.A',
  'Obstetrics & Gynecology':  'Sp.OG',
  'General Surgery':          'Sp.B',
  'Cardiology':               'Sp.JP',
  'Neurology':                'Sp.S',
  'Ophthalmology':            'Sp.M',
  'ENT':                      'Sp.THT',
  'Dermatology & Venereology':'Sp.KK',
  'Orthopedics':              'Sp.OT',
  'Urology':                  'Sp.U',
  'Psychiatry':               'Sp.KJ',
  'Pulmonology':              'Sp.P',
  // Dokter Umum / General Practitioner → tidak ada suffix
  // Gigi & Mulut / Dentistry → prefix drg. (ditangani sendiri)
};

/**
 * Format nama dokter lengkap dengan gelar.
 * @param {string} name           - Nama asli (tanpa gelar)
 * @param {string} specialization - Spesialisasi dari DoctorProfile
 * @param {string[]} additionalDegrees - Gelar tambahan (sub-spesialis, dll)
 * @returns {string} Nama lengkap, contoh: "dr. Ahmad Fauzi, Sp.PD, M.Kes"
 */
export const formatDoctorName = (name, specialization, additionalDegrees = []) => {
  if (!name) return 'Dokter';

  const isDental = specialization === 'Gigi & Mulut' || specialization === 'Dentistry';
  const prefix   = isDental ? 'drg.' : 'dr.';

  const specDegree = isDental ? '' : (SPEC_DEGREE[specialization] || '');
  const extra      = Array.isArray(additionalDegrees) ? additionalDegrees.filter(Boolean) : [];
  const allDegrees = [specDegree, ...extra].filter(Boolean);

  const suffix = allDegrees.length > 0 ? `, ${allDegrees.join(', ')}` : '';
  return `${prefix} ${name}${suffix}`;
};

/**
 * Ambil nama dari berbagai format objek dokter yang dikembalikan API.
 * Bisa berupa DoctorProfile (userId.name) atau langsung User (name).
 */
export const getDoctorDisplayName = (doctor) => {
  if (!doctor) return 'Dokter';
  const name = doctor.userId?.name || doctor.name || '';
  return formatDoctorName(name, doctor.specialization, doctor.additionalDegrees);
};
