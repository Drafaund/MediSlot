import { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, Badge, Avatar, Btn, Empty, Toast } from '../components/ui';

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
  const [toast, setToast] = useState(null);
  const [confirmId, setConfirmId] = useState(null); // ID yang sedang dikonfirmasi hapus

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

  const handleDelete = async (id) => {
    try {
      const { data } = await api.delete(`/auth/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u._id !== id));
      setToast(data.message);
    } catch (err) {
      setToast(err.response?.data?.message || 'Gagal menghapus akun');
    } finally {
      setConfirmId(null);
    }
  };

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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 100px 110px auto', gap: 16, padding: '10px 20px', borderBottom: '1px solid var(--border)' }}>
            {['Nama', 'Email', 'Role', 'Bergabung', ''].map((h, i) => (
              <span key={i} style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</span>
            ))}
          </div>

          {filtered.map((u, i) => {
            const initials = u.name?.split(' ').map(x => x[0]).slice(0, 2).join('') || '??';
            const isConfirming = confirmId === u._id;
            return (
              <div key={u._id} style={{
                display: 'grid', gridTemplateColumns: '1fr 1.5fr 100px 110px auto',
                gap: 16, padding: '12px 20px', alignItems: 'center',
                borderTop: i ? '1px solid var(--border)' : 'none',
                background: isConfirming ? '#FEF2F2' : 'none',
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

                {/* Kolom aksi — hanya pasien yang bisa dihapus */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {u.role === 'patient' && !isConfirming && (
                    <Btn variant="ghost" size="sm" icon="x" onClick={() => setConfirmId(u._id)}>
                      Hapus
                    </Btn>
                  )}
                  {isConfirming && (
                    <>
                      <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 500 }}>Yakin?</span>
                      <Btn variant="ghost" size="sm" onClick={() => handleDelete(u._id)}
                        style={{ color: '#DC2626', borderColor: '#FCA5A5' }}>
                        Ya, hapus
                      </Btn>
                      <Btn variant="ghost" size="sm" onClick={() => setConfirmId(null)}>Batal</Btn>
                    </>
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

export default AdminUsers;
