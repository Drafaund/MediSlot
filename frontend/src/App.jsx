import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useState, useEffect } from 'react';
import './index.css';

import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';

import Login from './pages/Login';
import Register from './pages/Register';
import GoogleSuccess from './pages/GoogleSuccess';
import Home from './pages/Home';
import SearchDoctor from './pages/SearchDoctor';
import DoctorDetail from './pages/DoctorDetail';
import BookingForm from './pages/BookingForm';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorSchedule from './pages/DoctorSchedule';
import DoctorRecord from './pages/DoctorRecord';
import DoctorProfileSetup from './pages/DoctorProfileSetup';
import PatientProfile from './pages/PatientProfile';
import MedicalHistory from './pages/MedicalHistory';
import SymptomChecker from './pages/SymptomChecker';
import AdminVerify from './pages/AdminVerify';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', color: 'var(--muted)', fontFamily: 'var(--sans)' }}>
      Memuat…
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const AppShell = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  // Desktop: sidebar terbuka by default; Mobile: tertutup by default
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);

  // Tutup sidebar saat navigasi — hanya di mobile
  useEffect(() => {
    if (window.innerWidth <= 768) setSidebarOpen(false);
  }, [location.pathname]);

  if (!user) return children;
  return (
    <div className="msApp">
      {/* Overlay gelap saat sidebar terbuka di mobile */}
      <div
        className={`msSidebar-overlay${sidebarOpen ? ' ms-open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="msMain">
        <TopBar onToggle={() => setSidebarOpen(o => !o)} />
        <div className="msMain-body">
          {children}
        </div>
      </main>
    </div>
  );
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Auth routes — no shell */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/auth/google/success" element={<GoogleSuccess />} />

      {/* Public + patient routes */}
      <Route path="/" element={<AppShell><Home /></AppShell>} />
      <Route path="/doctors" element={<AppShell><SearchDoctor /></AppShell>} />
      <Route path="/doctors/:id" element={<AppShell><DoctorDetail /></AppShell>} />
      <Route path="/symptom-checker" element={<AppShell><SymptomChecker /></AppShell>} />

      {/* Patient protected */}
      <Route path="/booking/:doctorId" element={
        <AppShell>
          <ProtectedRoute allowedRoles={['patient']}><BookingForm /></ProtectedRoute>
        </AppShell>
      } />
      <Route path="/dashboard" element={
        <AppShell>
          <ProtectedRoute allowedRoles={['patient']}><PatientDashboard /></ProtectedRoute>
        </AppShell>
      } />
      <Route path="/medical-history" element={
        <AppShell>
          <ProtectedRoute allowedRoles={['patient']}><MedicalHistory /></ProtectedRoute>
        </AppShell>
      } />
      <Route path="/profile" element={
        <AppShell>
          <ProtectedRoute allowedRoles={['patient']}><PatientProfile /></ProtectedRoute>
        </AppShell>
      } />

      {/* Doctor protected */}
      <Route path="/doctor/dashboard" element={
        <AppShell>
          <ProtectedRoute allowedRoles={['doctor']}><DoctorDashboard /></ProtectedRoute>
        </AppShell>
      } />
      <Route path="/doctor/schedule" element={
        <AppShell>
          <ProtectedRoute allowedRoles={['doctor']}><DoctorSchedule /></ProtectedRoute>
        </AppShell>
      } />
      <Route path="/doctor/profile" element={
        <AppShell>
          <ProtectedRoute allowedRoles={['doctor']}><DoctorProfileSetup /></ProtectedRoute>
        </AppShell>
      } />
      <Route path="/doctor/record/:patientId" element={
        <AppShell>
          <ProtectedRoute allowedRoles={['doctor']}><DoctorRecord /></ProtectedRoute>
        </AppShell>
      } />

      {/* Admin protected */}
      <Route path="/admin/verify" element={
        <AppShell>
          <ProtectedRoute allowedRoles={['admin']}><AdminVerify /></ProtectedRoute>
        </AppShell>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
