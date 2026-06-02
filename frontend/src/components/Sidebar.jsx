import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icon, Logo, Avatar } from './ui';
import api from '../services/api';

const AVATAR_COLORS = { patient: 'mauve', doctor: 'sage', admin: 'ocean' };

const SIDEBAR_ITEMS = {
  patient: [
    { path: '/', icon: 'home', label: 'Home' },
    { path: '/symptom-checker', icon: 'sparkles', label: 'Check Symptoms (AI)' },
    { path: '/doctors', icon: 'search', label: 'Find Doctor' },
    { path: '/dashboard', icon: 'calendar', label: 'Appointment' },
    { path: '/medical-history', icon: 'file', label: 'Health History' },
  ],
  doctor: [
    { path: '/doctor/dashboard', icon: 'home', label: 'Dashboard' },
    { path: '/doctor/schedule', icon: 'calendar', label: 'Practice Schedule' },
    { path: '/doctor/profile', icon: 'user', label: 'My Profile' },
  ],
  admin: [
    { path: '/admin/verify', icon: 'shield', label: 'Verify Doctors' },
    { path: '/admin/doctors', icon: 'stetho', label: 'All Doctors' },
    { path: '/admin/users', icon: 'users', label: 'Users' },
  ],
};

const Sidebar = ({ open = false, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch number of doctors pending verification — admin only
  useEffect(() => {
    if (user?.role !== 'admin') return;
    api.get('/doctors/admin/all')
      .then(({ data }) => {
        const count = (data.data || []).filter(d => d.verificationStatus === 'pending').length;
        setPendingCount(count);
      })
      .catch(() => {});
  }, [user, location.pathname]); // refresh on navigation so badge updates after verification

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

  const getBadge = (path) => {
    if (path === '/admin/verify' && pendingCount > 0) return String(pendingCount);
    return null;
  };

  return (
    <aside className={`msSidebar${open ? ' ms-open' : ''}`}>
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
        {items.map(it => {
          const badge = getBadge(it.path);
          return (
            <button key={it.path} onClick={() => navigate(it.path)}
              className={`msSide-item ${isActive(it.path) ? 'msSide-item-active' : ''}`}>
              <Icon name={it.icon} size={18}/>
              <span style={{ flex: 1, textAlign: 'left' }}>{it.label}</span>
              {badge && <span className="msSide-badge">{badge}</span>}
            </button>
          );
        })}
      </nav>

      <div className="msSide-foot">
        <div className="msSide-user">
          <Avatar initials={initials} color={color} size={36}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {role === 'patient' ? 'Patient' : role === 'doctor' ? 'Doctor' : 'Admin'}
            </div>
          </div>
          <button className="msIcon-btn" onClick={() => { logout(); navigate('/login'); }} title="Logout">
            <Icon name="logout" size={14}/>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
