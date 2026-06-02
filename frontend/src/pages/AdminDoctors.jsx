import { useState, useEffect } from 'react';
import api from '../services/api';
import { Icon, Card, Badge, Avatar, Btn, Empty, Toast } from '../components/ui';
import { formatDoctorName } from '../utils/doctorName';

const STATUS_BADGE = {
  verified: <Badge tone="sage" icon="check-circ">Verified</Badge>,
  pending:  <Badge tone="amber" icon="clock">Pending</Badge>,
  rejected: <Badge tone="coral" icon="x">Rejected</Badge>,
};

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/doctors/admin/all')
      .then(({ data }) => setDoctors(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleVerify = async (id, isVerified) => {
    try {
      const { data } = await api.put(`/doctors/${id}/verify`, { isVerified });
      setDoctors(prev => prev.map(d => d._id === id ? { ...d, isVerified: data.data.isVerified, verificationStatus: data.data.verificationStatus } : d));
      setToast(isVerified ? 'Doctor successfully verified' : 'Verification cancelled');
    } catch {
      setToast('Failed to change verification status');
    }
  };

  const filtered = doctors.filter(d => filter === 'all' || d.verificationStatus === filter);

  const counts = {
    all:      doctors.length,
    verified: doctors.filter(d => d.verificationStatus === 'verified').length,
    pending:  doctors.filter(d => d.verificationStatus === 'pending').length,
    rejected: doctors.filter(d => d.verificationStatus === 'rejected').length,
  };

  const getInitials = (d) => {
    const n = d.userId?.name || '';
    return n.split(' ').filter(x => !['dr.','drg.'].includes(x.toLowerCase())).map(x => x[0]).slice(0, 2).join('') || 'Dr';
  };

  return (
    <div className="msStack-md">
      <div>
        <div className="msEyebrow">Admin · Doctor Management</div>
        <h1 className="msPageTitle">All doctors</h1>
        <p style={{ color: 'var(--muted)', marginTop: 6 }}>
          {doctors.length} doctors registered on the platform
        </p>
      </div>

      {/* Filter tabs */}
      <div className="msTabs">
        {[
          ['all', `All (${counts.all})`],
          ['verified', `Verified (${counts.verified})`],
          ['pending', `Pending (${counts.pending})`],
          ['rejected', `Rejected (${counts.rejected})`],
        ].map(([v, l]) => (
          <button key={v} className={`msTab ${filter === v ? 'msTab-active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ height: 300, borderRadius: 14, background: 'var(--bg-2)' }}/>
      ) : filtered.length === 0 ? (
        <Empty icon="stetho" title="No doctors found" sub="No doctors with this status"/>
      ) : (
        <Card padded={false}>
          {filtered.map((d, i) => {
            const fullName = formatDoctorName(d.userId?.name || '', d.specialization, d.additionalDegrees);
            return (
              <div key={d._id} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '14px 20px',
                borderTop: i ? '1px solid var(--border)' : 'none',
              }}>
                <Avatar initials={getInitials(d)} color="ocean" size={44}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{fullName}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                    {d.specialization} · {d.clinicName} · {d.city}
                  </div>
                  {d.licenseNumber && (
                    <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)', marginTop: 2 }}>{d.licenseNumber}</div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {STATUS_BADGE[d.verificationStatus] || <Badge tone="neutral">{d.verificationStatus}</Badge>}
                  {d.verificationStatus !== 'verified' ? (
                    <Btn variant="secondary" size="sm" icon="check" onClick={() => handleVerify(d._id, true)}>
                      Verify
                    </Btn>
                  ) : (
                    <Btn variant="ghost" size="sm" onClick={() => handleVerify(d._id, false)}>
                      Revoke
                    </Btn>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {toast && <Toast msg={toast} onClose={() => setToast(null)}/>}
    </div>
  );
};

export default AdminDoctors;
