import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '1rem 2rem', backgroundColor: '#2E86AB', color: 'white'
    }}>
      <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.2rem' }}>
        MediSlot
      </Link>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Link to="/doctors" style={{ color: 'white', textDecoration: 'none' }}>Cari Dokter</Link>
        <Link to="/symptom-checker" style={{ color: 'white', textDecoration: 'none' }}>Cek Gejala</Link>
        {user ? (
          <>
            <Link
              to={user.role === 'doctor' ? '/doctor/dashboard' : '/dashboard'}
              style={{ color: 'white', textDecoration: 'none' }}
            >
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              style={{ background: 'transparent', border: '1px solid white', color: 'white', padding: '0.4rem 0.8rem', cursor: 'pointer', borderRadius: '4px' }}
            >
              Keluar
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>Masuk</Link>
            <Link to="/register" style={{ background: 'white', color: '#2E86AB', padding: '0.4rem 0.8rem', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold' }}>Daftar</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
