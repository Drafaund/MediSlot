import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icon, Avatar } from './ui';
import api from '../services/api';

const AVATAR_COLORS = { patient: 'mauve', doctor: 'sage', admin: 'ocean' };

const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} days ago`;
};

const TYPE_ICON = {
  booking_new: 'calendar',
  appointment_confirmed: 'check-circ',
  appointment_cancelled: 'x',
  appointment_cancelled_patient: 'x',
  appointment_cancelled_doctor: 'x',
  appointment_completed: 'check',
  record_created: 'file',
};

const NotifPanel = ({ notifs, unread, onMarkAll, onMarkOne, onClose }) => (
  <div style={{
    position: 'absolute', top: 48, right: 0, width: 340, zIndex: 200,
    background: 'var(--paper)', border: '1px solid var(--border)',
    borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    overflow: 'hidden',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontWeight: 600, fontSize: 14 }}>Notifications {unread > 0 && <span style={{ color: 'var(--accent)' }}>({unread} new)</span>}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {unread > 0 && (
          <button onClick={onMarkAll} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>
            Mark all as read
          </button>
        )}
        <button onClick={onClose} className="msIcon-btn" style={{ width: 24, height: 24 }}><Icon name="x" size={13}/></button>
      </div>
    </div>

    <div style={{ maxHeight: 380, overflowY: 'auto' }}>
      {notifs.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          No notifications yet
        </div>
      ) : notifs.map(n => (
        <button key={n._id} onClick={() => onMarkOne(n._id)}
          style={{
            width: '100%', display: 'flex', gap: 12, padding: '12px 16px', textAlign: 'left',
            background: n.isRead ? 'none' : 'var(--accent-soft)',
            border: 'none', borderBottom: '1px solid var(--border)',
            cursor: 'pointer', transition: 'background 0.15s',
          }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: n.isRead ? 'var(--bg-2)' : 'var(--accent)',
            display: 'grid', placeItems: 'center',
          }}>
            <Icon name={TYPE_ICON[n.type] || 'bell'} size={15} style={{ color: n.isRead ? 'var(--muted)' : 'white' }}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: n.isRead ? 'normal' : 600, fontSize: 13, lineHeight: 1.4 }}>{n.title}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2, lineHeight: 1.4 }}>{n.message}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{timeAgo(n.createdAt)}</div>
          </div>
          {!n.isRead && (
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 6 }}/>
          )}
        </button>
      ))}
    </div>
  </div>
);

const TopBar = ({ onToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const panelRef = useRef(null);
  const profileRef = useRef(null);

  const fetchNotifs = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/notifications');
      setNotifs(data.data || []);
      setUnread(data.unreadCount || 0);
    } catch { /* fail silently */ }
  }, [user]);

  // Fetch on mount + poll every 30 seconds
  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  // Close panel when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkOne = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifs(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch { /* fail silently */ }
  };

  const handleMarkAll = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnread(0);
    } catch { /* fail silently */ }
  };

  if (!user) return null;

  const initials = user.name?.split(' ').map(x => x[0]).slice(0, 2).join('') || '??';
  const color = AVATAR_COLORS[user.role] || 'sage';
  const subLabel = user.role === 'patient' ? 'Patient' : user.role === 'doctor' ? 'Doctor' : 'Admin';

  return (
    <div className="msTopbar">
      {/* Hamburger — only visible on mobile via CSS */}
      <button className="msHamburger msIcon-btn msIcon-btn-lg" onClick={onToggle} aria-label="Open menu">
        <Icon name="menu" size={18}/>
      </button>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Bell + panel */}
        <div ref={panelRef} style={{ position: 'relative' }}>
          <button
            className="msIcon-btn msIcon-btn-lg"
            style={{ position: 'relative' }}
            onClick={() => setOpen(o => !o)}
          >
            <Icon name="bell" size={16}/>
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 4,
                width: 16, height: 16, borderRadius: '50%',
                background: 'var(--accent)', color: 'white',
                fontSize: 9, fontWeight: 700,
                display: 'grid', placeItems: 'center',
                lineHeight: 1,
              }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {open && (
            <NotifPanel
              notifs={notifs}
              unread={unread}
              onMarkAll={handleMarkAll}
              onMarkOne={handleMarkOne}
              onClose={() => setOpen(false)}
            />
          )}
        </div>

        <div style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 4px' }}/>

        {/* Avatar + dropdown */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setProfileOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 10, transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <Avatar initials={initials} color={color} size={34}/>
            <div style={{ fontSize: 13, textAlign: 'left' }}>
              <div style={{ fontWeight: 600 }}>{user.name?.split(' ').slice(0, 2).join(' ')}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{subLabel}</div>
            </div>
            <Icon name="chevron-d" size={13} style={{ color: 'var(--muted)', marginLeft: 2 }}/>
          </button>

          {profileOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 220, zIndex: 200,
              background: 'var(--paper)', border: '1px solid var(--border)',
              borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
              overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{user.email}</div>
              </div>

              {/* Menu items */}
              <div style={{ padding: '6px 0' }}>
                {user.role === 'patient' && (
                  <button onClick={() => { setProfileOpen(false); navigate('/profile'); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--ink-2)', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <Icon name="user" size={15}/>
                    My Profile
                  </button>
                )}
                {user.role === 'doctor' && (
                  <button onClick={() => { setProfileOpen(false); navigate('/doctor/profile'); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--ink-2)', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <Icon name="user" size={15}/>
                    Doctor Profile
                  </button>
                )}
                <button onClick={() => { setProfileOpen(false); navigate(user.role === 'patient' ? '/dashboard' : `/${user.role}/dashboard`); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--ink-2)', transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <Icon name="settings" size={15}/>
                  Dashboard
                </button>
              </div>

              {/* Logout */}
              <div style={{ padding: '6px 0', borderTop: '1px solid var(--border)' }}>
                <button onClick={() => { setProfileOpen(false); logout(); navigate('/login'); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--warn)', transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <Icon name="logout" size={15}/>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
