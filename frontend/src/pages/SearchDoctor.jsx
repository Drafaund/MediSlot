import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Icon, Card, Btn, Input, Select, Empty, DoctorCard } from '../components/ui';

const SPECIALIZATIONS = [
  { value: 'Dokter Umum', label: 'Dokter Umum' },
  { value: 'Penyakit Dalam', label: 'Penyakit Dalam (Sp.PD)' },
  { value: 'Anak', label: 'Anak (Sp.A)' },
  { value: 'Kandungan', label: 'Kandungan (Sp.OG)' },
  { value: 'Jantung', label: 'Jantung (Sp.JP)' },
  { value: 'Kulit', label: 'Kulit & Kelamin (Sp.KK)' },
  { value: 'Mata', label: 'Mata (Sp.M)' },
  { value: 'THT', label: 'THT (Sp.THT)' },
  { value: 'Jiwa', label: 'Kesehatan Jiwa (Sp.KJ)' },
  { value: 'Gigi', label: 'Gigi (drg.)' },
];

const CITIES = ['Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Semarang', 'Medan', 'Tangerang'];

const SearchDoctor = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [q, setQ] = useState(searchParams.get('search') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [specialization, setSpecialization] = useState(searchParams.get('specialization') || '');
  const [bpjsOnly, setBpjsOnly] = useState(searchParams.get('acceptBPJS') === 'true');
  const [sort, setSort] = useState('fee');
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocError('Browser tidak mendukung geolokasi.');
      return;
    }
    setLocating(true);
    setLocError('');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&accept-language=id`,
            { headers: { 'User-Agent': 'MediSlot/1.0' } }
          );
          const data = await res.json();
          const addr = data.address || {};
          // Ambil nama kota dari field yang tersedia, prioritas kota > kota madya > kabupaten
          const raw = addr.city || addr.town || addr.municipality || addr.county || addr.state_district || '';
          // Hilangkan prefix "Kota " atau "Kabupaten "
          const detected = raw.replace(/^(kota|kabupaten)\s+/i, '').trim();
          if (detected) {
            setCity(detected);
            const params = buildParams({ city: detected });
            applyAndFetch(params);
          } else {
            setLocError('Kota tidak terdeteksi. Coba pilih manual.');
          }
        } catch {
          setLocError('Gagal mendapatkan nama kota. Coba pilih manual.');
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) setLocError('Izin lokasi ditolak. Aktifkan di pengaturan browser.');
        else setLocError('Gagal mendeteksi lokasi. Coba pilih manual.');
      },
      { timeout: 8000 }
    );
  };

  const buildParams = useCallback((overrides = {}) => {
    const base = { search: q, city, specialization, acceptBPJS: bpjsOnly };
    const merged = { ...base, ...overrides };
    const params = {};
    if (merged.search) params.search = merged.search;
    if (merged.city) params.city = merged.city;
    if (merged.specialization) params.specialization = merged.specialization;
    if (merged.acceptBPJS) params.acceptBPJS = 'true';
    return params;
  }, [q, city, specialization, bpjsOnly]);

  const fetchDoctors = useCallback(async (params) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/doctors', { params });
      setDoctors(data.data || []);
    } catch {
      setError('Gagal memuat dokter. Coba lagi.');
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const applyAndFetch = useCallback((params) => {
    setSearchParams(params);
    fetchDoctors(params);
  }, [setSearchParams, fetchDoctors]);

  useEffect(() => { fetchDoctors(buildParams()); /* eslint-disable-next-line */ }, []);

  const handleSearchChange = (val) => {
    setQ(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => applyAndFetch(buildParams({ search: val })), 500);
  };

  const sortedDoctors = [...doctors].sort((a, b) => {
    if (sort === 'fee') return (a.consultationFee || 0) - (b.consultationFee || 0);
    if (sort === 'experience') return (b.yearsOfExperience || 0) - (a.yearsOfExperience || 0);
    return 0;
  });

  const mapDoctor = (d) => ({
    ...d,
    name: d.userId?.name || 'Dokter',
    initials: d.userId?.name?.split(' ').map(x => x[0]).slice(0, 2).join('') || 'Dr',
    color: 'sage',
    specLabel: d.specialization,
    clinic: d.clinicName,
    fee: d.consultationFee || 0,
    bpjs: d.acceptBPJS,
    experience: d.yearsOfExperience || 0,
  });

  return (
    <div className="msStack-md">
      <div>
        <div className="msEyebrow">Pencarian</div>
        <h1 className="msPageTitle">Cari dokter</h1>
      </div>

      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr auto', gap: 12 }}>
          <Input icon="search" placeholder="Nama dokter, spesialisasi, atau klinik…" value={q} onChange={handleSearchChange}/>
          <Select value={specialization} onChange={v => { setSpecialization(v); applyAndFetch(buildParams({ specialization: v })); }}
            placeholder="Semua spesialisasi" options={SPECIALIZATIONS}/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ flex: 1 }}>
                <Select value={city} onChange={v => { setCity(v); applyAndFetch(buildParams({ city: v })); }}
                  placeholder="Semua kota" options={CITIES}/>
              </div>
              <button
                onClick={detectLocation}
                disabled={locating}
                title="Deteksi lokasi saya"
                style={{
                  flexShrink: 0, height: 40, padding: '0 10px', borderRadius: 8,
                  border: '1px solid var(--border)', background: locating ? 'var(--bg-2)' : 'var(--paper)',
                  cursor: locating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                  color: locating ? 'var(--muted)' : 'var(--accent)', fontSize: 13, fontWeight: 500,
                  transition: 'all 0.15s',
                }}
              >
                <Icon name="pin" size={14}/>
                {locating ? 'Mendeteksi…' : 'Lokasiku'}
              </button>
            </div>
            {locError && (
              <div style={{ fontSize: 11, color: 'var(--warn)', lineHeight: 1.4 }}>{locError}</div>
            )}
            {!locError && city && !CITIES.includes(city) && (
              <div style={{ fontSize: 11, color: 'var(--accent)', lineHeight: 1.4 }}>
                📍 Terdeteksi: {city}
              </div>
            )}
          </div>
          <Btn variant="secondary" icon="filter" onClick={() => applyAndFetch(buildParams())}>Filter</Btn>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label className="msToggle">
              <input type="checkbox" checked={bpjsOnly} onChange={e => { setBpjsOnly(e.target.checked); applyAndFetch(buildParams({ acceptBPJS: e.target.checked })); }}/>
              <span className="msToggle-track"/>
              <span>Hanya yang menerima BPJS</span>
            </label>
            <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 6px' }}/>
            <div className="msTabs-mini">
              {[['fee', 'Harga terendah'], ['experience', 'Pengalaman terlama']].map(([v, l]) => (
                <button key={v} className={`msTab-mini ${sort === v ? 'msTab-mini-active' : ''}`} onClick={() => setSort(v)}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>
            {loading ? 'Mencari…' : <><strong style={{ color: 'var(--ink)' }}>{sortedDoctors.length}</strong> dokter ditemukan</>}
          </div>
        </div>
      </Card>

      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--warn-soft)', border: '1px solid var(--warn)', borderRadius: 10, color: 'var(--warn)', fontSize: 14 }}>
          {error}
        </div>
      )}

      {!loading && !error && sortedDoctors.length === 0 && (
        <Empty icon="search" title="Tidak ada dokter yang cocok" sub="Coba ubah filter atau kata kunci pencarian"/>
      )}

      {!loading && sortedDoctors.length > 0 && (
        <div className="msGrid-2">
          {sortedDoctors.map(d => <DoctorCard key={d._id} d={mapDoctor(d)} onClick={() => navigate(`/doctors/${d._id}`)}/>)}
        </div>
      )}

      {loading && (
        <div className="msGrid-2">
          {[1,2,3,4].map(i => (
            <div key={i} style={{ height: 140, borderRadius: 14, background: 'var(--bg-2)' }}/>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchDoctor;
