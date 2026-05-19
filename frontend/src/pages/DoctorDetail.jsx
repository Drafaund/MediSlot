import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Icon, Card, Badge, Avatar, Btn, SectionHeader, Empty, formatIDR } from '../components/ui';

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const DoctorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const { data } = await api.get(`/doctors/${id}`);
        setDoctor(data.data);
        // Fetch slots for today
        const today = new Date().toISOString().split('T')[0];
        try {
          const slotsRes = await api.get(`/schedules/${id}/slots?date=${today}`);
          setSlots(slotsRes.data.data?.slice(0, 3) || []);
        } catch { /* no slots available */ }
      } catch {
        setError('Dokter tidak ditemukan.');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Memuat profil dokter…</div>;
  if (error || !doctor) return <Empty icon="user" title="Dokter tidak ditemukan" sub={error} action={<Btn variant="secondary" onClick={() => navigate('/doctors')}>Kembali ke pencarian</Btn>}/>;

  const d = doctor;
  const initials = d.userId?.name?.split(' ').map(x => x[0]).slice(0, 2).join('') || d.name?.split(' ').map(x => x[0]).slice(0, 2).join('') || 'Dr';
  const doctorName = d.userId?.name || d.name || 'Dokter';
  const activeDays = [1, 3, 5]; // Mon, Wed, Fri as default display

  return (
    <div className="msStack-md" style={{ maxWidth: 1040 }}>
      <button className="msBack" onClick={() => navigate('/doctors')}>
        <Icon name="chevron-l" size={16}/> Kembali ke pencarian
      </button>

      <Card>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <Avatar initials={initials} color="sage" size={88} ring/>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Badge tone="sage" icon="check-circ">Terverifikasi</Badge>
              {d.acceptBPJS && <Badge tone="ink" icon="shield">Menerima BPJS</Badge>}
            </div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 600, lineHeight: 1.1 }}>{doctorName}</h1>
            <div style={{ color: 'var(--muted)', marginTop: 6, fontSize: 15 }}>
              {d.specialization} · {d.experience || 5} tahun pengalaman
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 16, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="star" size={16} style={{ fill: '#D4A017', color: '#D4A017' }}/>
                <strong>{d.rating || 4.8}</strong>
                <span style={{ color: 'var(--muted)' }}>({d.reviewCount || 0} ulasan)</span>
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="pin" size={14}/> {d.city}
              </div>
              {d.licenseNumber && (
                <div style={{ color: 'var(--muted)', fontSize: 14, fontFamily: 'var(--mono)' }}>{d.licenseNumber}</div>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="msEyebrow">Tarif konsultasi</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 28, marginTop: 4 }}>{formatIDR(d.consultationFee || 0)}</div>
            <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>per sesi · sudah termasuk pemeriksaan</div>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
        <Card>
          <div className="msEyebrow">Tentang dokter</div>
          <p style={{ marginTop: 10, lineHeight: 1.65, color: 'var(--ink-2)' }}>{d.bio || 'Dokter berpengalaman di bidangnya, menerima pasien dengan penuh perhatian.'}</p>

          <div style={{ marginTop: 24 }} className="msEyebrow">Lokasi praktik</div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center' }}>
              <Icon name="pin" size={18}/>
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{d.clinicName}</div>
              <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 2 }}>{d.clinicAddress}</div>
            </div>
          </div>

          <div style={{ marginTop: 24 }} className="msEyebrow">Jadwal praktik</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginTop: 10 }}>
            {DAYS.map((day, i) => {
              const active = activeDays.includes(i);
              return (
                <div key={i} style={{
                  padding: '10px 4px', borderRadius: 10,
                  background: active ? 'var(--accent-soft)' : 'var(--bg-2)',
                  color: active ? 'var(--accent)' : 'var(--muted)',
                  textAlign: 'center', fontSize: 12,
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{day}</div>
                  <div style={{ fontSize: 10 }}>{active ? '08–12' : '—'}</div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="msEyebrow" style={{ marginBottom: 12 }}>Pilih jadwal</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 18, marginBottom: 16 }}>Slot terdekat tersedia:</div>
          {slots.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {slots.map((s, i) => (
                <button key={i} className="msSlot-line" onClick={() => navigate(`/booking/${id}`)}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.time || s}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.date || 'Tersedia'}</div>
                  </div>
                  <Icon name="chevron-r" size={16}/>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ padding: '12px 0', color: 'var(--muted)', fontSize: 14 }}>
              Jadwal tersedia — klik tombol di bawah untuk melihat semua slot
            </div>
          )}
          {user ? (
            <Btn variant="primary" icon="calendar" full size="lg" style={{ marginTop: 16 }} onClick={() => navigate(`/booking/${id}`)}>
              Lihat semua tanggal & booking
            </Btn>
          ) : (
            <Btn variant="primary" icon="calendar" full size="lg" style={{ marginTop: 16 }} onClick={() => navigate('/login')}>
              Masuk untuk booking
            </Btn>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DoctorDetail;
