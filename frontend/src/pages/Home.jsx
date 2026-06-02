import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Icon, Card, Badge, Avatar, Btn, SectionHeader, DoctorCard } from '../components/ui';

const QUICK_ACTIONS = [
  { icon: 'stetho', label: 'Cari dokter', sub: 'Temukan spesialis terbaik', path: '/doctors' },
  { icon: 'sparkles', label: 'Cek gejala (AI)', sub: 'Rekomendasi spesialisasi', path: '/symptom-checker' },
  { icon: 'file', label: 'Riwayat kesehatan', sub: 'Rekam medis digitalmu', path: '/medical-history' },
  { icon: 'calendar', label: 'Appointment saya', sub: 'Jadwal konsultasi aktif', path: '/dashboard' },
];

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [upcomingAppt, setUpcomingAppt] = useState(null);
  const [topDoctors, setTopDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [apptRes, docRes] = await Promise.allSettled([
          api.get('/appointments/my'),
          api.get('/doctors?limit=4'),
        ]);
        if (apptRes.status === 'fulfilled') {
          const confirmed = apptRes.value.data.data?.find(a => a.status === 'confirmed' || a.status === 'pending');
          setUpcomingAppt(confirmed || null);
        }
        if (docRes.status === 'fulfilled') {
          setTopDoctors(docRes.value.data.data?.slice(0, 4) || []);
        }
      } catch {
        // silently fail — page still renders
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'Pasien';

  return (
    <div className="msStack-lg">
      {/* Hero */}
      <div className="msHero">
        <div className="msHero-text">
          <div className="msEyebrow" style={{ marginBottom: 12 }}>Hari ini · {today}</div>
          <h1 className="msHero-title">
            Halo, <span className="msHero-name">{firstName}</span>.<br/>
            <span className="msSerif" style={{ color: 'var(--accent)' }}>Apa yang bisa</span>{' '}
            <span className="msSerif">kami bantu hari ini?</span>
          </h1>
          <div className="msHero-search" onClick={() => navigate('/doctors')}>
            <Icon name="search" size={18} style={{ color: 'var(--muted)' }}/>
            <span style={{ color: 'var(--muted)' }}>Cari dokter, spesialisasi, atau klinik…</span>
            <span className="msHero-kbd">⌘ K</span>
          </div>
        </div>
        <div className="msHero-aside">
          <button className="msAI-card" onClick={() => navigate('/symptom-checker')}>
            <div className="msAI-glow"/>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Icon name="sparkles" size={16}/>
                <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>MediSlot AI</span>
              </div>
              <div className="msAI-title">Tidak yakin harus<br/>ke dokter apa?</div>
              <div className="msAI-sub">Ceritakan gejala, AI akan merekomendasikan spesialisasi yang tepat.</div>
              <div className="msAI-cta">
                <span>Mulai Symptom Checker</span>
                <Icon name="arrow-r" size={16}/>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Upcoming appointment */}
      {upcomingAppt && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div className="msEyebrow">Appointment berikutnya</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 22, marginTop: 4 }}>
                {new Date(upcomingAppt.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })} · {upcomingAppt.timeSlot} WIB
              </div>
            </div>
            <Badge tone={upcomingAppt.status === 'confirmed' ? 'sage' : 'amber'} icon={upcomingAppt.status === 'confirmed' ? 'check-circ' : 'clock'}>
              {upcomingAppt.status === 'confirmed' ? 'Dikonfirmasi' : 'Menunggu'}
            </Badge>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0', borderTop: '1px solid var(--border)' }}>
            <Avatar initials={upcomingAppt.doctorId?.name?.split(' ').map(x => x[0]).slice(0, 2).join('') || 'Dr'} color="sage" size={56}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{upcomingAppt.doctorId?.name || 'Dokter'}</div>
              <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 2 }}>
                {upcomingAppt.doctorId?.specialization} · {upcomingAppt.doctorId?.clinicName}
              </div>
            </div>
            {upcomingAppt.queueNumber && (
              <div className="msQueue">
                <span className="msQueue-lbl">Nomor antrian</span>
                <span className="msQueue-num">{String(upcomingAppt.queueNumber).padStart(2, '0')}</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <Btn variant="primary" icon="calendar" onClick={() => navigate('/dashboard')}>Detail Booking</Btn>
            <Btn variant="ghost" icon="x">Batalkan</Btn>
          </div>
        </Card>
      )}

      {/* Quick actions */}
      <div>
        <SectionHeader title="Akses cepat" sub="Empat hal yang paling sering dilakukan"/>
        <div className="msGrid-4">
          {QUICK_ACTIONS.map(a => (
            <Card key={a.label} hover onClick={() => navigate(a.path)}>
              <div className="msQA-icon"><Icon name={a.icon} size={20}/></div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{a.label}</div>
              <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>{a.sub}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* Top doctors */}
      {!loading && topDoctors.length > 0 && (
        <div>
          <SectionHeader
            title="Direkomendasikan untukmu"
            sub="Dokter tersedia di platform MediSlot"
            action={<Btn variant="ghost" iconRight="arrow-r" onClick={() => navigate('/doctors')}>Lihat semua</Btn>}
          />
          <div className="msGrid-2">
            {topDoctors.map(d => (
              <DoctorCard key={d._id} d={{ ...d, name: d.userId?.name || 'Dokter', initials: d.userId?.name?.split(' ').map(x => x[0]).slice(0, 2).join('') || 'Dr', color: 'sage', specLabel: d.specialization, clinic: d.clinicName, fee: d.consultationFee, bpjs: d.acceptBPJS, experience: d.yearsOfExperience || 0 }} onClick={() => navigate(`/doctors/${d._id}`)}/>
            ))}
          </div>
        </div>
      )}

      {/* Loading skeleton if data not ready */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ height: 120, borderRadius: 14, background: 'var(--bg-2)', animation: 'pulse 1.5s ease-in-out infinite' }}/>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
