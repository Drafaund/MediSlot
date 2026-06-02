import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Icon, Card, Btn, Input, Select, Empty, DoctorCard } from '../components/ui';
import { formatDoctorName } from '../utils/doctorName';

const SPECIALIZATIONS = [
  { value: 'Dokter Umum',           label: 'General Practitioner' },
  { value: 'Penyakit Dalam',        label: 'Internal Medicine (Sp.PD)' },
  { value: 'Anak',                  label: 'Pediatrics (Sp.A)' },
  { value: 'Kandungan',             label: 'Obstetrics & Gynecology (Sp.OG)' },
  { value: 'Bedah Umum',            label: 'General Surgery (Sp.B)' },
  { value: 'Jantung & Pembuluh Darah', label: 'Cardiology (Sp.JP)' },
  { value: 'Saraf',                 label: 'Neurology (Sp.S)' },
  { value: 'Mata',                  label: 'Ophthalmology (Sp.M)' },
  { value: 'THT',                   label: 'ENT (Sp.THT)' },
  { value: 'Kulit & Kelamin',       label: 'Dermatology & Venereology (Sp.KK)' },
  { value: 'Ortopedi',              label: 'Orthopedics (Sp.OT)' },
  { value: 'Urologi',               label: 'Urology (Sp.U)' },
  { value: 'Psikiatri',             label: 'Psychiatry (Sp.KJ)' },
  { value: 'Paru',                  label: 'Pulmonology (Sp.P)' },
  { value: 'Gigi & Mulut',          label: 'Dentistry (drg.)' },
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
      setLocError('Your browser does not support geolocation.');
      return;
    }
    setLocating(true);
    setLocError('');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&accept-language=en`,
            { headers: { 'User-Agent': 'MediSlot/1.0' } }
          );
          const data = await res.json();
          const addr = data.address || {};
          // Get city name from available fields, priority: city > town > municipality > county
          const raw = addr.city || addr.town || addr.municipality || addr.county || addr.state_district || '';
          // Remove "Kota " or "Kabupaten " prefix
          const detected = raw.replace(/^(kota|kabupaten)\s+/i, '').trim();
          if (detected) {
            setCity(detected);
            const params = buildParams({ city: detected });
            applyAndFetch(params);
          } else {
            setLocError('City not detected. Please select manually.');
          }
        } catch {
          setLocError('Failed to get city name. Please select manually.');
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) setLocError('Location permission denied. Enable it in browser settings.');
        else setLocError('Failed to detect location. Please select manually.');
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
      setError('Failed to load doctors. Please try again.');
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

  const mapDoctor = (d) => {
    const baseName = d.userId?.name || '';
    const fullName = formatDoctorName(baseName, d.specialization, d.additionalDegrees);
    return ({
    ...d,
    name: fullName,
    initials: baseName.split(' ').map(x => x[0]).slice(0, 2).join('') || 'Dr',
    color: 'sage',
    specLabel: d.specialization,
    clinic: d.clinicName,
    fee: d.consultationFee || 0,
    bpjs: d.acceptBPJS,
    experience: d.yearsOfExperience || 0,
  });};

  return (
    <div className="msStack-md">
      <div>
        <div className="msEyebrow">Search</div>
        <h1 className="msPageTitle">Find a doctor</h1>
      </div>

      <Card>
        <div className="msSearch-filter">
          <Input icon="search" placeholder="Doctor name, specialization, or clinic…" value={q} onChange={handleSearchChange}/>
          <Select value={specialization} onChange={v => { setSpecialization(v); applyAndFetch(buildParams({ specialization: v })); }}
            placeholder="All specializations" options={SPECIALIZATIONS}/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ flex: 1 }}>
                <Select value={city} onChange={v => { setCity(v); applyAndFetch(buildParams({ city: v })); }}
                  placeholder="All cities" options={CITIES}/>
              </div>
              <button
                onClick={detectLocation}
                disabled={locating}
                title="Detect my location"
                style={{
                  flexShrink: 0, height: 40, padding: '0 10px', borderRadius: 8,
                  border: '1px solid var(--border)', background: locating ? 'var(--bg-2)' : 'var(--paper)',
                  cursor: locating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                  color: locating ? 'var(--muted)' : 'var(--accent)', fontSize: 13, fontWeight: 500,
                  transition: 'all 0.15s',
                }}
              >
                <Icon name="pin" size={14}/>
                {locating ? 'Detecting…' : 'My location'}
              </button>
            </div>
            {locError && (
              <div style={{ fontSize: 11, color: 'var(--warn)', lineHeight: 1.4 }}>{locError}</div>
            )}
            {!locError && city && !CITIES.includes(city) && (
              <div style={{ fontSize: 11, color: 'var(--accent)', lineHeight: 1.4 }}>
                📍 Detected: {city}
              </div>
            )}
          </div>
          <Btn variant="secondary" icon="filter" onClick={() => applyAndFetch(buildParams())}>Filter</Btn>
        </div>
        <div className="msSearch-filter-sub">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label className="msToggle">
              <input type="checkbox" checked={bpjsOnly} onChange={e => { setBpjsOnly(e.target.checked); applyAndFetch(buildParams({ acceptBPJS: e.target.checked })); }}/>
              <span className="msToggle-track"/>
              <span>BPJS accepted only</span>
            </label>
            <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 6px' }}/>
            <div className="msTabs-mini">
              {[['fee', 'Lowest price'], ['experience', 'Most experienced']].map(([v, l]) => (
                <button key={v} className={`msTab-mini ${sort === v ? 'msTab-mini-active' : ''}`} onClick={() => setSort(v)}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>
            {loading ? 'Searching…' : <><strong style={{ color: 'var(--ink)' }}>{sortedDoctors.length}</strong> doctors found</>}
          </div>
        </div>
      </Card>

      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--warn-soft)', border: '1px solid var(--warn)', borderRadius: 10, color: 'var(--warn)', fontSize: 14 }}>
          {error}
        </div>
      )}

      {!loading && !error && sortedDoctors.length === 0 && (
        <Empty icon="search" title="No matching doctors found" sub="Try changing your filters or search keyword"/>
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
