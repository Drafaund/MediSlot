import { useState, useEffect } from 'react';
import api from '../services/api';
import { Icon, Card, Badge, Avatar, Btn, Stat, Empty, Toast } from '../components/ui';

const AdminVerify = () => {
  const [doctors, setDoctors] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get('/doctors/admin/all');
        const all = data.data || [];
        setAllDoctors(all);
        // Hanya tampilkan yang belum pernah ditinjau (bukan yang sudah ditolak)
        const pending = all.filter(d => d.verificationStatus === 'pending');
        setDoctors(pending);
        if (pending.length > 0) setSelectedId(pending[0]._id);
      } catch { /* fail silently */ }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const selected = doctors.find(d => d._id === selectedId);

  const handleVerify = async () => {
    if (!selected) return;
    try {
      await api.put(`/doctors/${selected._id}/verify`, { isVerified: true });
      const name = selected.userId?.name || selected.name || 'Dokter';
      setDoctors(prev => prev.filter(d => d._id !== selectedId));
      setAllDoctors(prev => prev.map(d => d._id === selectedId ? { ...d, isVerified: true } : d));
      setToast(`${name} berhasil diverifikasi`);
      const next = doctors.find(d => d._id !== selectedId);
      setSelectedId(next?._id || null);
    } catch {
      setToast('Gagal memverifikasi dokter');
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    const name = selected.userId?.name || selected.name || 'Dokter';
    try {
      // Panggil API agar notifikasi penolakan terkirim ke dokter
      await api.put(`/doctors/${selected._id}/verify`, { isVerified: false });
      setDoctors(prev => prev.filter(d => d._id !== selectedId));
      setAllDoctors(prev => prev.map(d => d._id === selectedId ? { ...d, isVerified: false } : d));
      setToast(`Pendaftaran ${name} ditolak`);
      const next = doctors.find(d => d._id !== selectedId);
      setSelectedId(next?._id || null);
    } catch {
      setToast('Gagal menolak pendaftaran');
    }
  };

  const verified = allDoctors.filter(d => d.isVerified);

  const getInitials = (d) => {
    const n = d.userId?.name || d.name || 'Dr';
    return n.split(' ').filter(x => !['dr.', 'drg.'].includes(x.toLowerCase())).map(x => x[0]).slice(0, 2).join('');
  };

  return (
    <div className="msStack-md">
      <div>
        <div className="msEyebrow">Admin Panel · Verifikasi Dokter</div>
        <h1 className="msPageTitle">Antrian verifikasi</h1>
        <p style={{ color: 'var(--muted)', marginTop: 6 }}>
          Verifikasi pendaftaran dokter baru sebelum profil mereka aktif di platform
        </p>
      </div>

      <div className="msGrid-4">
        <Stat label="Menunggu verifikasi" value={doctors.length} sub="Antrian saat ini" icon="clock" tone="accent"/>
        <Stat label="Total dokter aktif" value={verified.length} sub="Di seluruh platform" icon="stetho"/>
        <Stat label="Total terdaftar" value={allDoctors.length} sub="Semua status" icon="users"/>
        <Stat label="Target verifikasi" value="<24j" sub="Per pendaftaran" icon="sparkles"/>
      </div>

      <div className="msTabs">
        {[['pending', `Menunggu (${doctors.length})`], ['verified', `Terverifikasi (${verified.length})`]].map(([v, l]) => (
          <button key={v} className={`msTab ${tab === v ? 'msTab-active' : ''}`} onClick={() => setTab(v)}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ height: 300, borderRadius: 14, background: 'var(--bg-2)' }}/>
      ) : tab === 'pending' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 16 }}>
          <Card padded={false}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 17 }}>Antrian pendaftaran</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Diurutkan dari terbaru</div>
            </div>
            {doctors.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <Empty icon="check-circ" title="Semua sudah diverifikasi!" sub="Tidak ada antrian pendaftaran"/>
              </div>
            ) : (
              <div>
                {doctors.map(d => (
                  <button key={d._id} onClick={() => setSelectedId(d._id)}
                    className={`msVerify-row ${selectedId === d._id ? 'msVerify-row-active' : ''}`}>
                    <Avatar initials={getInitials(d)} color="ocean" size={40}/>
                    <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <strong style={{ fontSize: 14 }}>{d.userId?.name || d.name || 'Dokter'}</strong>
                        <Badge tone="neutral" size="sm">{d.specialization}</Badge>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {d.clinicName} · {d.city}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {selected ? (
            <Card>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, paddingBottom: 18, borderBottom: '1px solid var(--border)' }}>
                <Avatar initials={getInitials(selected)} color="ocean" size={64}/>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: 4 }}>
                    <Badge tone="amber" icon="clock">Menunggu verifikasi</Badge>
                  </div>
                  <h2 style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 600, lineHeight: 1.1 }}>
                    {selected.userId?.name || selected.name || 'Dokter'}
                  </h2>
                  <div style={{ color: 'var(--muted)', marginTop: 4 }}>{selected.specialization} · {selected.clinicName}, {selected.city}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 18 }}>
                <div>
                  <div className="msEyebrow">Nomor STR</div>
                  <div style={{ marginTop: 6, fontFamily: 'var(--mono)', fontSize: 14 }}>{selected.licenseNumber || '—'}</div>
                </div>
                <div>
                  <div className="msEyebrow">Status STR</div>
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                    <Icon name="check-circ" size={14} style={{ color: 'var(--accent)' }}/>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Perlu verifikasi manual</span>
                  </div>
                </div>
                <div>
                  <div className="msEyebrow">Email</div>
                  <div style={{ marginTop: 6, fontSize: 14 }}>{selected.userId?.email || '—'}</div>
                </div>
                <div>
                  <div className="msEyebrow">Spesialisasi</div>
                  <div style={{ marginTop: 6, fontSize: 14 }}>{selected.specialization}</div>
                </div>
              </div>

              {selected.bio && (
                <div style={{ marginTop: 18 }}>
                  <div className="msEyebrow">Bio</div>
                  <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.65, color: 'var(--ink-2)' }}>{selected.bio}</p>
                </div>
              )}

              <div style={{ marginTop: 24, padding: 14, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <Icon name="info" size={16} style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }}/>
                  <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-2)' }}>
                    Pastikan nama di STR sesuai dengan nama pendaftaran dan spesialisasi terdaftar valid sebelum memverifikasi.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
                <Btn variant="primary" icon="check" onClick={handleVerify}>Verifikasi & aktifkan</Btn>
                <Btn variant="ghost" icon="x" onClick={handleReject}>Tolak pendaftaran</Btn>
              </div>
            </Card>
          ) : <Empty title="Tidak ada pendaftaran dipilih"/>}
        </div>
      ) : (
        <Card padded={false}>
          {verified.length === 0 ? (
            <Empty icon="stetho" title="Belum ada dokter terverifikasi"/>
          ) : verified.map((d, i) => (
            <div key={d._id} style={{ padding: '14px 18px', borderTop: i ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar initials={getInitials(d)} color="sage" size={36}/>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: 14 }}>{d.userId?.name || d.name}</strong>
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>{d.specialization} · {d.clinicName} · {d.city}</div>
              </div>
              {d.licenseNumber && <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>{d.licenseNumber}</span>}
              <Badge tone="sage" icon="check-circ">Aktif</Badge>
            </div>
          ))}
        </Card>
      )}

      {toast && <Toast msg={toast} onClose={() => setToast(null)}/>}
    </div>
  );
};

export default AdminVerify;
