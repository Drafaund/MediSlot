import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icon, Avatar } from './ui';

const AVATAR_COLORS = { patient: 'mauve', doctor: 'sage', admin: 'ocean' };

const TopBar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const initials = user.name?.split(' ').map(x => x[0]).slice(0, 2).join('') || '??';
  const color = AVATAR_COLORS[user.role] || 'sage';
  const subLabel = user.role === 'patient' ? 'Pasien' : user.role === 'doctor' ? 'Dokter' : 'Admin';

  return (
    <div className="msTopbar">
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
        {user.role === 'patient' && (
          <button className="msTopbar-search" onClick={() => navigate('/doctors')}>
            <Icon name="search" size={16} style={{ color: 'var(--muted)' }}/>
            <span style={{ color: 'var(--muted)', fontSize: 14 }}>Cari dokter, spesialisasi, atau klinik…</span>
            <span className="msHero-kbd" style={{ marginLeft: 'auto' }}>⌘K</span>
          </button>
        )}
        {user.role !== 'patient' && (
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            <span style={{ color: 'var(--ink-2)' }}>{user.name}</span>
            <span> · </span>
            <span>{user.email}</span>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="msIcon-btn msIcon-btn-lg" style={{ position: 'relative' }}>
          <Icon name="bell" size={16}/>
          <span className="msTopbar-dot"/>
        </button>
        <button className="msIcon-btn msIcon-btn-lg" onClick={() => navigate(user.role === 'patient' ? '/dashboard' : `/${user.role}/dashboard`)}>
          <Icon name="settings" size={16}/>
        </button>
        <div style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 6px' }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar initials={initials} color={color} size={34}/>
          <div style={{ fontSize: 13 }}>
            <div style={{ fontWeight: 600 }}>{user.name?.split(' ').slice(0, 2).join(' ')}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{subLabel}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
