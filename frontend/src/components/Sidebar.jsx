import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icon, Logo, Avatar } from './ui';

const AVATAR_COLORS = { patient: 'mauve', doctor: 'sage', admin: 'ocean' };

const SIDEBAR_ITEMS = {
  patient: [
    { path: '/', icon: 'home', label: 'Beranda' },
    { path: '/symptom-checker', icon: 'sparkles', label: 'Cek Gejala (AI)' },
    { path: '/doctors', icon: 'search', label: 'Cari Dokter' },
    { path: '/dashboard', icon: 'calendar', label: 'Appointment' },
    { path: '/medical-history', icon: 'file', label: 'Riwayat Kesehatan' },
  ],
  doctor: [
    { path: '/doctor/dashboard', icon: 'home', label: 'Dashboard' },
    { path: '/doctor/schedule', icon: 'calendar', label: 'Jadwal Praktik' },
    { path: '/doctor/profile', icon: 'user', label: 'Profil Saya' },
  ],
  admin: [
    { path: '/admin/verify', icon: 'shield', label: 'Verifikasi Dokter', badge: '3' },
    { path: '/admin/doctors', icon: 'stetho', label: 'Semua Dokter' },
    { path: '/admin/users', icon: 'users', label: 'Pengguna' },
  ],
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const role = user.role;
  const items = SIDEBAR_ITEMS[role] || SIDEBAR_ITEMS.patient;
  const initials = user.name?.split(' ').map(x => x[0]).slice(0, 2).join('') || '??';
  const color = AVATAR_COLORS[role] || 'sage';

  const portalLabel = role === 'patient' ? 'Patient Portal' : role === 'doctor' ? 'Doctor Portal' : 'Admin Console';

  const isActive = (path) => {
    if (path === '/' && role === 'patient') return location.pathname === '/';
    return location.pathname.startsWith(path) && path !== '/';
  };

  return (
    <aside className="msSidebar">
      <div className="msSide-brand">
        <Logo size={28}/>
        <div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 20, lineHeight: 1, fontWeight: 600 }}>MediSlot</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 2 }}>
            {portalLabel}
          </div>
        </div>
      </div>

      <nav className="msSide-nav">
        {items.map(it => (
          <button key={it.path} onClick={() => navigate(it.path)}
            className={`msSide-item ${isActive(it.path) ? 'msSide-item-active' : ''}`}>
            <Icon name={it.icon} size={18}/>
            <span style={{ flex: 1, textAlign: 'left' }}>{it.label}</span>
            {it.badge && <span className="msSide-badge">{it.badge}</span>}
          </button>
        ))}
      </nav>

      <div className="msSide-foot">
        <div className="msSide-user">
          <Avatar initials={initials} color={color} size={36}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {role === 'patient' ? 'Pasien' : role === 'doctor' ? 'Dokter' : 'Admin'}
            </div>
          </div>
          <button className="msIcon-btn" onClick={() => { logout(); navigate('/login'); }} title="Keluar">
            <Icon name="logout" size={14}/>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
