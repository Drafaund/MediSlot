import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Icon, Card, Badge, Avatar, Btn, Stat, SectionHeader, Empty } from '../components/ui';

const STATUS_BADGE = {
  completed: <Badge tone="sage" icon="check-circ">Selesai</Badge>,
  in_progress: <Badge tone="accent" icon="stetho">Sedang berlangsung</Badge>,
  waiting: <Badge tone="neutral" icon="clock">Menunggu</Badge>,
  confirmed: <Badge tone="sage" icon="check-circ">Dikonfirmasi</Badge>,
  pending: <Badge tone="amber" icon="clock">Menunggu</Badge>,
};

const DoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    api.get('/appointments/doctor')
      .then(({ data }) => {
        const appts = data.data || [];
        setAppointments(appts);
        if (appts.length > 0) setSelectedId(appts[0]._id);
      })
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: appointments.length,
    completed: appointments.filter(a => a.status === 'completed').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    pending: appointments.filter(a => a.status === 'pending').length,
  };

  const selected = appointments.find(a => a._id === selectedId);
  const patientInitials = (name) => name?.split(' ').map(x => x[0]).slice(0, 2).join('') || 'PS';

  const updateStatus = async (id, newStatus) => {
    try {
      await api.put(`/appointments/${id}/status`, { status: newStatus });
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: newStatus } : a));
    } catch { /* fail silently */ }
  };

  return (
    <div className="msStack-md">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div className="msEyebrow">{today}</div>
          <h1 className="msPageTitle">Praktik hari ini</h1>
          <p style={{ color: 'var(--muted)', marginTop: 6 }}>Selamat datang kembali, {user?.name?.split(' ')[0]}</p>
        </div>
        <Btn variant="secondary" icon="calendar" onClick={() => navigate('/doctor/schedule')}>Atur jadwal</Btn>
      </div>

      <div className="msGrid-4">
        <Stat label="Total appointment" value={stats.total} sub="Hari ini" icon="users" tone="accent"/>
        <Stat label="Selesai" value={stats.completed} sub={`${stats.total > 0 ? Math.round(stats.completed/stats.total*100) : 0}% dari total`} icon="check-circ"/>
        <Stat label="Dikonfirmasi" value={stats.confirmed} sub="Siap konsultasi" icon="stetho" tone="accent"/>
        <Stat label="Menunggu" value={stats.pending} sub="Perlu konfirmasi" icon="clock"/>
      </div>

      {loading ? (
        <div style={{ height: 300, borderRadius: 14, background: 'var(--bg-2)' }}/>
      ) : appointments.length === 0 ? (
        <Empty icon="calendar" title="Belum ada appointment hari ini" sub="Pasien akan muncul di sini setelah booking"/>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
          {/* Queue list */}
          <Card padded={false}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>Antrian pasien</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                  Total: <strong style={{ color: 'var(--ink)', fontFamily: 'var(--mono)' }}>{appointments.length}</strong> pasien
                </div>
              </div>
            </div>
            <div>
              {appointments.map(a => {
                const p = a.patientId;
                const initials = patientInitials(p?.name);
                return (
                  <button key={a._id} onClick={() => setSelectedId(a._id)}
                    className={`msQueue-row msQueue-${a.status} ${selectedId === a._id ? 'msQueue-row-active' : ''}`}>
                    <div className="msQueue-num-cell">
                      <div className="msQueue-num-tag">#{String(a.queueNumber || 1).padStart(2, '0')}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, fontFamily: 'var(--mono)' }}>{a.timeSlot}</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: 14 }}>{p?.name || 'Pasien'}</strong>
                      </div>
                      {a.notes && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{a.notes}</div>}
                    </div>
                    <div style={{ minWidth: 130, textAlign: 'right' }}>
                      {STATUS_BADGE[a.status] || <Badge tone="neutral">{a.status}</Badge>}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Patient detail */}
          <div style={{ position: 'sticky', top: 24, alignSelf: 'flex-start' }}>
            {selected ? (
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                  <Avatar initials={patientInitials(selected.patientId?.name)} color="mauve" size={56}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{selected.patientId?.name || 'Pasien'}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 13 }}>{selected.patientId?.email}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="msEyebrow">Antrian</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 700, lineHeight: 1, marginTop: 2 }}>
                      #{String(selected.queueNumber || 1).padStart(2, '0')}
                    </div>
                  </div>
                </div>

                {selected.notes && (
                  <div style={{ marginTop: 16 }}>
                    <div className="msEyebrow">Keluhan dari pasien</div>
                    <p style={{ marginTop: 6, fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)' }}>{selected.notes}</p>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>
                  {(selected.status === 'pending' || selected.status === 'confirmed') && (
                    <>
                      <Btn variant="primary" icon="doc-add" full onClick={() => navigate(`/doctor/record/${selected._id}`)}>
                        Input rekam medis
                      </Btn>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Btn variant="secondary" full icon="check" onClick={() => updateStatus(selected._id, 'completed')}>
                          Selesaikan konsultasi
                        </Btn>
                        <Btn variant="ghost" icon="x" onClick={() => updateStatus(selected._id, 'cancelled')}>Tolak</Btn>
                      </div>
                    </>
                  )}
                  {selected.status === 'completed' && (
                    <Btn variant="secondary" icon="file" full onClick={() => navigate(`/doctor/record/${selected._id}`)}>
                      Lihat rekam medis
                    </Btn>
                  )}
                </div>
              </Card>
            ) : <Empty title="Pilih pasien dari antrian"/>}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
