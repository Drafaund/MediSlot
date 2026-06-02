import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getDoctorDisplayName } from '../utils/doctorName';
import { Icon, Card, Badge, Avatar, Btn, Empty, Toast } from '../components/ui';

const statusBadge = (status) => {
  switch (status) {
    case 'confirmed': return <Badge tone="sage" icon="check-circ">Dikonfirmasi</Badge>;
    case 'pending': return <Badge tone="amber" icon="clock">Menunggu konfirmasi</Badge>;
    case 'cancelled': return <Badge tone="coral" icon="x">Dibatalkan</Badge>;
    case 'completed': return <Badge tone="neutral" icon="check">Selesai</Badge>;
    default: return <Badge tone="neutral">{status}</Badge>;
  }
};

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('upcoming');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    api.get('/appointments/my')
      .then(({ data }) => setAppointments(data.data || []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, []);

  const upcoming = appointments.filter(a => ['pending', 'confirmed'].includes(a.status));
  const past = appointments.filter(a => ['completed', 'cancelled'].includes(a.status));

  const handleCancel = async (id) => {
    try {
      await api.put(`/appointments/${id}/status`, { status: 'cancelled' });
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: 'cancelled' } : a));
      setToast('Appointment berhasil dibatalkan');
    } catch {
      setToast('Gagal membatalkan appointment');
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="msStack-md">
      <div>
        <div className="msEyebrow">Appointment</div>
        <h1 className="msPageTitle">Booking saya</h1>
      </div>

      <div className="msTabs">
        {[['upcoming', `Aktif (${upcoming.length})`], ['past', `Selesai (${past.length})`]].map(([v, l]) => (
          <button key={v} className={`msTab ${tab === v ? 'msTab-active' : ''}`} onClick={() => setTab(v)}>{l}</button>
        ))}
      </div>

      {loading && (
        <div className="msStack-sm">
          {[1,2].map(i => <div key={i} style={{ height: 120, borderRadius: 14, background: 'var(--bg-2)' }}/>)}
        </div>
      )}

      {!loading && tab === 'upcoming' && (
        upcoming.length === 0 ? (
          <Empty icon="calendar" title="Belum ada appointment aktif" sub="Booking dokter untuk mulai"
            action={<Btn variant="primary" icon="search" onClick={() => navigate('/doctors')}>Cari dokter</Btn>}/>
        ) : (
          <div className="msStack-sm">
            {upcoming.map(a => {
              const d = a.doctorId;
              const baseName = d?.userId?.name || d?.name || '';
              const initials = baseName.split(' ').map(x => x[0]).slice(0, 2).join('') || 'Dr';
              const fullName = getDoctorDisplayName(d);
              return (
                <Card key={a._id}>
                  <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 76, padding: '12px 8px', borderRadius: 12,
                      background: a.status === 'confirmed' ? 'var(--accent-soft)' : '#F2E6CC',
                      color: a.status === 'confirmed' ? 'var(--accent)' : '#7A5520',
                      textAlign: 'center', flexShrink: 0,
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>
                        {new Date(a.date).toLocaleDateString('id-ID', { weekday: 'short' })}
                      </div>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: 28, lineHeight: 1, margin: '4px 0' }}>
                        {new Date(a.date).getDate()}
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 600 }}>
                        {new Date(a.date).toLocaleDateString('id-ID', { month: 'short' })}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        {statusBadge(a.status)}
                        <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                          <Icon name="clock" size={12}/> {a.timeSlot} WIB
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <Avatar initials={initials} color="sage" size={36}/>
                        <div>
                          <div style={{ fontWeight: 600 }}>{fullName}</div>
                          <div style={{ color: 'var(--muted)', fontSize: 13 }}>{d?.specialization} · {d?.clinicName}</div>
                        </div>
                      </div>
                      {a.notes && (
                        <div style={{ fontSize: 13, color: 'var(--ink-2)', padding: '8px 12px', background: 'var(--bg-2)', borderRadius: 8 }}>
                          <span style={{ color: 'var(--muted)' }}>Catatan: </span>{a.notes}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 120 }}>
                      {a.queueNumber && (
                        <>
                          <div className="msEyebrow">Antrian</div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 700, lineHeight: 1, marginTop: 2 }}>
                            #{String(a.queueNumber).padStart(2, '0')}
                          </div>
                        </>
                      )}
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 10 }}>
                        {a.status === 'confirmed' || a.status === 'pending' ? (
                          <Btn variant="ghost" size="sm" icon="x" onClick={() => handleCancel(a._id)}>Batal</Btn>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      )}

      {!loading && tab === 'past' && (
        past.length === 0 ? (
          <Empty icon="file" title="Belum ada riwayat appointment"/>
        ) : (
          <div className="msStack-sm">
            {past.map(a => {
              const d = a.doctorId;
              const baseName2 = d?.userId?.name || d?.name || '';
              const initials = baseName2.split(' ').map(x => x[0]).slice(0, 2).join('') || 'Dr';
              return (
                <Card key={a._id} hover onClick={() => navigate('/medical-history')}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <Avatar initials={initials} color="sage" size={44}/>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{getDoctorDisplayName(d)}</div>
                      <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>
                        {formatDate(a.date)} · {a.timeSlot} · {d?.clinicName}
                      </div>
                    </div>
                    {statusBadge(a.status)}
                    {a.status === 'completed' && (
                      <Btn variant="ghost" iconRight="arrow-r" size="sm">Lihat rekam medis</Btn>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )
      )}

      {toast && <Toast msg={toast} onClose={() => setToast(null)}/>}
    </div>
  );
};

export default PatientDashboard;
