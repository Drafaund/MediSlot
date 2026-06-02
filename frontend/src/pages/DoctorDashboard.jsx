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
  const [profile, setProfile] = useState(null);   // DoctorProfile untuk cek status verifikasi
  const [profileLoading, setProfileLoading] = useState(true);

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    api.get('/doctors/my-profile')
      .then(({ data }) => setProfile(data.data))
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false));
  }, []);

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

  const calcAge = (dob) => {
    if (!dob) return null;
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

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

      {/* Banner status onboarding / verifikasi */}
      {!profileLoading && !profile && (
        <div style={{ display: 'flex', gap: 14, padding: '16px 20px', background: 'var(--accent-soft)', borderRadius: 12, border: '1px solid var(--accent)' }}>
          <Icon name="info" size={20} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>Selamat datang! Profil belum dibuat</div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>
              Lengkapi profil praktik dan jadwal Anda agar pasien bisa menemukan dan booking dengan Anda.
            </div>
          </div>
          <Btn variant="primary" size="sm" onClick={() => navigate('/doctor/profile?onboarding=true')}>Buat profil</Btn>
        </div>
      )}

      {!profileLoading && profile && profile.verificationStatus === 'pending' && (
        <div style={{ display: 'flex', gap: 14, padding: '16px 20px', background: '#FEF3C7', borderRadius: 12, border: '1px solid #FCD34D' }}>
          <Icon name="clock" size={20} style={{ color: '#92400E', flexShrink: 0, marginTop: 2 }}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: '#92400E', marginBottom: 4 }}>Menunggu verifikasi admin</div>
            <div style={{ fontSize: 13, color: '#78350F', lineHeight: 1.6 }}>
              Profil Anda sedang ditinjau. Setelah diverifikasi, Anda akan muncul di pencarian pasien
              dan dapat menerima appointment. Anda akan mendapat notifikasi setelah proses selesai.
            </div>
          </div>
        </div>
      )}

      {!profileLoading && profile && profile.verificationStatus === 'rejected' && (
        <div style={{ display: 'flex', gap: 14, padding: '16px 20px', background: '#FEF2F2', borderRadius: 12, border: '1px solid #FCA5A5' }}>
          <Icon name="x" size={20} style={{ color: '#DC2626', flexShrink: 0, marginTop: 2 }}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: '#DC2626', marginBottom: 4 }}>Verifikasi ditolak</div>
            <div style={{ fontSize: 13, color: '#7F1D1D', lineHeight: 1.6 }}>
              Profil Anda belum dapat diverifikasi. Perbarui informasi profil Anda dan hubungi admin MediSlot untuk informasi lebih lanjut.
            </div>
          </div>
          <Btn variant="ghost" size="sm" onClick={() => navigate('/doctor/profile')}>Perbarui profil</Btn>
        </div>
      )}

      {!profileLoading && profile?.isVerified && (
        <div style={{ display: 'flex', gap: 12, padding: '12px 16px', background: '#F0FDF4', borderRadius: 10, border: '1px solid #86EFAC', alignItems: 'center' }}>
          <Icon name="check-circ" size={16} style={{ color: '#16A34A', flexShrink: 0 }}/>
          <span style={{ fontSize: 13, color: '#14532D' }}>
            Profil Anda aktif dan terverifikasi — pasien dapat menemukan dan booking dengan Anda.
          </span>
        </div>
      )}

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
                    <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                      {[selected.patientId?.gender, calcAge(selected.patientId?.dateOfBirth) != null ? `${calcAge(selected.patientId?.dateOfBirth)} tahun` : null].filter(Boolean).join(' · ') || selected.patientId?.email}
                    </div>
                    {selected.patientId?.bloodType && (
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                        Gol. darah: <strong>{selected.patientId.bloodType}</strong>
                      </div>
                    )}
                    {selected.patientId?.allergies?.length > 0 && (
                      <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {selected.patientId.allergies.map(a => (
                          <span key={a} style={{ padding: '1px 7px', borderRadius: 6, background: '#FEF3C7', color: '#92400E', fontSize: 11, fontWeight: 500 }}>
                            ⚠ {a}
                          </span>
                        ))}
                      </div>
                    )}
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
