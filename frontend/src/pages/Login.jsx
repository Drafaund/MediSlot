import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icon, Logo, Btn, Input } from '../components/ui';
import api from '../services/api';

const Login = () => {
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('patient');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let userData;
      if (mode === 'login') {
        userData = await login(email, password);
      } else {
        userData = await register(name, email, password, role);
      }

      if (userData?.role === 'doctor') {
        try {
          await api.get('/doctors/my-profile');
          navigate('/doctor/dashboard');
        } catch {
          navigate('/doctor/profile?onboarding=true');
        }
      } else if (userData?.role === 'patient') {
        // Pasien baru (register) → wajib isi profil dulu
        if (mode === 'register') {
          navigate('/profile?onboarding=true');
        } else {
          // Login: cek apakah profil sudah lengkap
          const isComplete = userData.dateOfBirth && userData.gender;
          navigate(isComplete ? '/' : '/profile?onboarding=true');
        }
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan, coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    const base = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/google`;
    // Saat register, kirim role sebagai query param agar disimpan di state OAuth
    const roleParam = mode === 'register' ? `?role=${role}` : '';
    window.location.href = `${base}${roleParam}`;
  };

  return (
    <div className="msLogin">
      <div className="msLogin-art">
        <div style={{ position: 'absolute', top: 32, left: 32, display: 'flex', alignItems: 'center', gap: 10, zIndex: 1 }}>
          <Logo size={32}/>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 600, color: 'var(--paper)' }}>MediSlot</span>
        </div>
        <div className="msLogin-art-bg"/>
        <div className="msLogin-art-content">
          <div className="msLogin-eyebrow-row">
            <span className="msLogin-eyebrow-line"/>
            <span style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', opacity: 0.45 }}>
              Booking dokter, sederhana
            </span>
          </div>
          <div>
            <div className="msLogin-big-word">
              Akses dokter<br/>
              <span style={{ color: '#C4DAD0' }}>terbaik</span>
            </div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 400, lineHeight: 1.35, opacity: 0.78, marginTop: 8 }}>
              di kota kamu,<br/>
              <span style={{ fontStyle: 'italic', opacity: 0.7 }}>tanpa antrian panjang.</span>
            </div>
          </div>
          <p style={{ marginTop: 28, fontSize: 13.5, opacity: 0.5, lineHeight: 1.75, maxWidth: 360 }}>
            Booking jadwal, simpan riwayat kesehatan, dan dapatkan rekomendasi dari AI — semuanya dalam satu platform.
          </p>
          <div className="msLogin-feature-dots">
            {['Jadwal online', 'AI Symptom Checker', 'Rekam medis digital'].map(f => (
              <span key={f} className="msLogin-feature-dot">{f}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="msLogin-form">
        <div style={{ maxWidth: 380, width: '100%' }}>
          <div className="msEyebrow">{mode === 'login' ? 'Masuk' : 'Daftar baru'}</div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 34, fontWeight: 600, marginTop: 6 }}>
            {mode === 'login' ? 'Selamat datang kembali' : 'Buat akun MediSlot'}
          </h2>
          <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: 14 }}>
            {mode === 'login' ? 'Masuk untuk melanjutkan ke MediSlot' : 'Gratis, hanya butuh 30 detik'}
          </p>

          {mode === 'register' && (
            <div style={{ marginTop: 20 }}>
              <span className="msField-lbl">Saya adalah</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
                <button type="button" onClick={() => setRole('patient')} className={`msRole ${role === 'patient' ? 'msRole-active' : ''}`}>
                  <Icon name="user" size={20}/>
                  <strong>Pasien</strong>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>Mencari dokter</span>
                </button>
                <button type="button" onClick={() => setRole('doctor')} className={`msRole ${role === 'doctor' ? 'msRole-active' : ''}`}>
                  <Icon name="stetho" size={20}/>
                  <strong>Dokter</strong>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>Menerima pasien</span>
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <button type="button" onClick={handleGoogle} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 10, padding: '12px 20px', borderRadius: 10,
              border: '1px solid var(--border)', background: 'var(--paper)',
              fontSize: 15, fontWeight: 500, cursor: 'pointer',
              transition: 'background 0.15s, border-color 0.15s', color: 'var(--ink)',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.borderColor = 'var(--border-2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--paper)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              {/* Google SVG resmi */}
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Lanjut dengan Google
            </button>
          </div>

          <div className="msDivider"><span>atau dengan email</span></div>

          <form onSubmit={handleSubmit}>
            <div className="msStack-sm">
              {mode === 'register' && (
                <Input label="Nama lengkap" placeholder="Sri Lestari" value={name} onChange={setName}/>
              )}
              <Input label="Email" type="email" placeholder="kamu@email.com" icon="user" value={email} onChange={setEmail}/>
              <Input label="Password" type="password" placeholder="Minimal 8 karakter" value={password} onChange={setPassword}/>
            </div>

            {error && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--warn-soft)', border: '1px solid var(--warn)', borderRadius: 10, fontSize: 13, color: 'var(--warn)' }}>
                {error}
              </div>
            )}

            <Btn variant="primary" full size="lg" type="submit" style={{ marginTop: 20 }} disabled={loading}>
              {loading ? 'Memproses…' : mode === 'login' ? 'Masuk' : 'Daftar sekarang'}
            </Btn>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--muted)' }}>
            {mode === 'login' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
            <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 500, cursor: 'pointer', font: 'inherit' }}>
              {mode === 'login' ? 'Daftar gratis' : 'Masuk'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
