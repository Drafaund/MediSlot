import { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, Badge, Avatar, Empty } from '../components/ui';

const ROLE_BADGE = {
  patient: <Badge tone="neutral" icon="user">Pasien</Badge>,
  doctor:  <Badge tone="sage"    icon="stetho">Dokter</Badge>,
  admin:   <Badge tone="ocean"   icon="shield">Admin</Badge>,
};

const AVATAR_COLOR = { patient: 'mauve', doctor: 'sage', admin: 'ocean' };

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/auth/admin/users')
      .then(({ data }) => setUsers(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? users : users.filter(u => u.role === filter);

  const counts = {
    all:     users.length,
    patient: users.filter(u => u.role === 'patient').length,
    doctor:  users.filter(u => u.role === 'doctor').length,
    admin:   users.filter(u => u.role === 'admin').length,
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="msStack-md">
      <div>
        <div className="msEyebrow">Admin · Manajemen Pengguna</div>
        <h1 className="msPageTitle">Semua pengguna</h1>
        <p style={{ color: 'var(--muted)', marginTop: 6 }}>
          {users.length} pengguna terdaftar di platform
        </p>
      </div>

      {/* Filter tabs */}
      <div className="msTabs">
        {[
          ['all',     `Semua (${counts.all})`],
          ['patient', `Pasien (${counts.patient})`],
          ['doctor',  `Dokter (${counts.doctor})`],
          ['admin',   `Admin (${counts.admin})`],
        ].map(([v, l]) => (
          <button key={v} className={`msTab ${filter === v ? 'msTab-active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ height: 300, borderRadius: 14, background: 'var(--bg-2)' }}/>
      ) : filtered.length === 0 ? (
        <Empty icon="users" title="Tidak ada pengguna" sub="Tidak ada pengguna dengan role ini"/>
      ) : (
        <Card padded={false}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 100px 120px', gap: 16, padding: '10px 20px', borderBottom: '1px solid var(--border)' }}>
            {['Nama', 'Email', 'Role', 'Bergabung'].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</span>
            ))}
          </div>

          {filtered.map((u, i) => {
            const initials = u.name?.split(' ').map(x => x[0]).slice(0, 2).join('') || '??';
            return (
              <div key={u._id} style={{
                display: 'grid', gridTemplateColumns: '1fr 1.5fr 100px 120px',
                gap: 16, padding: '12px 20px', alignItems: 'center',
                borderTop: i ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <Avatar initials={initials} color={AVATAR_COLOR[u.role] || 'sage'} size={34}/>
                  <span style={{ fontWeight: 500, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.name}
                  </span>
                </div>
                <span style={{ fontSize: 13, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.email}
                </span>
                <span>{ROLE_BADGE[u.role] || <Badge tone="neutral">{u.role}</Badge>}</span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>{formatDate(u.createdAt)}</span>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
};

export default AdminUsers;
