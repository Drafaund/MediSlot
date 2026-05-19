import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GoogleSuccess = () => {
  const [searchParams] = useSearchParams();
  const { loginWithGoogleToken, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      loginWithGoogleToken(token);
    } else {
      navigate('/login?error=no_token');
    }
  }, []);

  useEffect(() => {
    if (user) {
      // Redirect berdasarkan role
      navigate(user.role === 'doctor' ? '/doctor/dashboard' : '/dashboard');
    }
  }, [user]);

  return (
    <div style={{ textAlign: 'center', padding: '3rem' }}>
      <p>Memproses login Google...</p>
    </div>
  );
};

export default GoogleSuccess;
