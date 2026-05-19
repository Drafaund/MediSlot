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
  const [sort, setSort] = useState('rating');

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

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
    if (sort === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sort === 'fee') return (a.consultationFee || 0) - (b.consultationFee || 0);
    return 0;
  });

  const mapDoctor = (d) => ({
    ...d,
    initials: d.name?.split(' ').map(x => x[0]).slice(0, 2).join('') || 'Dr',
    color: 'sage',
    specLabel: d.specialization,
    clinic: d.clinicName,
    fee: d.consultationFee || 0,
    bpjs: d.acceptBPJS,
    rating: d.rating || 4.8,
    reviews: d.reviewCount || 0,
    experience: d.experience || 5,
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
          <Select value={city} onChange={v => { setCity(v); applyAndFetch(buildParams({ city: v })); }}
            placeholder="Semua kota" options={CITIES}/>
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
              {[['rating', 'Rating tertinggi'], ['fee', 'Harga terendah']].map(([v, l]) => (
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
