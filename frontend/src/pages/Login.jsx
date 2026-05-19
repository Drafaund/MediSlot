import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icon, Logo, Btn, Input } from '../components/ui';

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
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password, role);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan, coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/google`;
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
          <div style={{ fontSize: 14, opacity: 0.7, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 16 }}>
            Booking dokter, sederhana
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 56, lineHeight: 1.05, fontWeight: 600, margin: 0 }}>
            Akses dokter <span style={{ color: '#DCEAE3' }}>terbaik</span><br/>
            di kota kamu, <span style={{ color: '#DCEAE3' }}>tanpa antrian panjang.</span>
          </h1>
          <p style={{ marginTop: 24, fontSize: 16, opacity: 0.8, maxWidth: 460, lineHeight: 1.6 }}>
            Booking jadwal, simpan riwayat kesehatan, dan dapatkan rekomendasi dari AI — semuanya dalam satu platform.
          </p>
          <div style={{ display: 'flex', gap: 24, marginTop: 40, alignItems: 'flex-start' }}>
            {[['2.3k+', 'Dokter terverifikasi'], ['180+', 'Klinik mitra'], ['4.8★', 'Rating pengguna']].map(([val, lbl], i, arr) => (
              <div key={i} style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 32 }}>{val}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{lbl}</div>
                </div>
                {i < arr.length - 1 && <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.15)' }}/>}
              </div>
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
            <Btn variant="secondary" full size="lg" icon="user" onClick={handleGoogle} type="button">
              Lanjut dengan Google
            </Btn>
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
