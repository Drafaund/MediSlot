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
        // Only show those not yet reviewed (not rejected)
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
      const name = selected.userId?.name || selected.name || 'Doctor';
      setDoctors(prev => prev.filter(d => d._id !== selectedId));
      setAllDoctors(prev => prev.map(d => d._id === selectedId ? { ...d, isVerified: true } : d));
      setToast(`${name} successfully verified`);
      const next = doctors.find(d => d._id !== selectedId);
      setSelectedId(next?._id || null);
    } catch {
      setToast('Failed to verify doctor');
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    const name = selected.userId?.name || selected.name || 'Doctor';
    try {
      // Call API so rejection notification is sent to doctor
      await api.put(`/doctors/${selected._id}/verify`, { isVerified: false });
      setDoctors(prev => prev.filter(d => d._id !== selectedId));
      setAllDoctors(prev => prev.map(d => d._id === selectedId ? { ...d, isVerified: false } : d));
      setToast(`${name}'s registration rejected`);
      const next = doctors.find(d => d._id !== selectedId);
      setSelectedId(next?._id || null);
    } catch {
      setToast('Failed to reject registration');
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
        <div className="msEyebrow">Admin Panel · Doctor Verification</div>
        <h1 className="msPageTitle">Verification queue</h1>
        <p style={{ color: 'var(--muted)', marginTop: 6 }}>
          Verify new doctor registrations before their profiles go live on the platform
        </p>
      </div>

      <div className="msGrid-4">
        <Stat label="Pending verification" value={doctors.length} sub="Current queue" icon="clock" tone="accent"/>
        <Stat label="Total active doctors" value={verified.length} sub="Across the platform" icon="stetho"/>
        <Stat label="Total registered" value={allDoctors.length} sub="All statuses" icon="users"/>
        <Stat label="Verification target" value="<24h" sub="Per registration" icon="sparkles"/>
      </div>

      <div className="msTabs">
        {[['pending', `Pending (${doctors.length})`], ['verified', `Verified (${verified.length})`]].map(([v, l]) => (
          <button key={v} className={`msTab ${tab === v ? 'msTab-active' : ''}`} onClick={() => setTab(v)}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ height: 300, borderRadius: 14, background: 'var(--bg-2)' }}/>
      ) : tab === 'pending' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 16 }}>
          <Card padded={false}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 17 }}>Registration queue</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Sorted by most recent</div>
            </div>
            {doctors.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <Empty icon="check-circ" title="All verified!" sub="No pending registrations"/>
              </div>
            ) : (
              <div>
                {doctors.map(d => (
                  <button key={d._id} onClick={() => setSelectedId(d._id)}
                    className={`msVerify-row ${selectedId === d._id ? 'msVerify-row-active' : ''}`}>
                    <Avatar initials={getInitials(d)} color="ocean" size={40}/>
                    <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <strong style={{ fontSize: 14 }}>{d.userId?.name || d.name || 'Doctor'}</strong>
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
                    <Badge tone="amber" icon="clock">Pending verification</Badge>
                  </div>
                  <h2 style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 600, lineHeight: 1.1 }}>
                    {selected.userId?.name || selected.name || 'Doctor'}
                  </h2>
                  <div style={{ color: 'var(--muted)', marginTop: 4 }}>{selected.specialization} · {selected.clinicName}, {selected.city}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 18 }}>
                <div>
                  <div className="msEyebrow">License Number (STR)</div>
                  <div style={{ marginTop: 6, fontFamily: 'var(--mono)', fontSize: 14 }}>{selected.licenseNumber || '—'}</div>
                </div>
                <div>
                  <div className="msEyebrow">License Status</div>
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                    <Icon name="check-circ" size={14} style={{ color: 'var(--accent)' }}/>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Requires manual verification</span>
                  </div>
                </div>
                <div>
                  <div className="msEyebrow">Email</div>
                  <div style={{ marginTop: 6, fontSize: 14 }}>{selected.userId?.email || '—'}</div>
                </div>
                <div>
                  <div className="msEyebrow">Specialization</div>
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
                    Ensure the name on the license matches the registration name and the registered specialization is valid before verifying.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
                <Btn variant="primary" icon="check" onClick={handleVerify}>Verify & activate</Btn>
                <Btn variant="ghost" icon="x" onClick={handleReject}>Reject registration</Btn>
              </div>
            </Card>
          ) : <Empty title="No registration selected"/>}
        </div>
      ) : (
        <Card padded={false}>
          {verified.length === 0 ? (
            <Empty icon="stetho" title="No verified doctors yet"/>
          ) : verified.map((d, i) => (
            <div key={d._id} style={{ padding: '14px 18px', borderTop: i ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar initials={getInitials(d)} color="sage" size={36}/>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: 14 }}>{d.userId?.name || d.name}</strong>
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>{d.specialization} · {d.clinicName} · {d.city}</div>
              </div>
              {d.licenseNumber && <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>{d.licenseNumber}</span>}
              <Badge tone="sage" icon="check-circ">Active</Badge>
            </div>
          ))}
        </Card>
      )}

      {toast && <Toast msg={toast} onClose={() => setToast(null)}/>}
    </div>
  );
};

export default AdminVerify;
