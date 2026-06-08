import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth, AuthProvider } from './hooks/useAuth'
import Login from './pages/Login'
import Treino from './pages/Treino'
import Dashboard from './pages/Dashboard'
import Certificado from './pages/Certificado'

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/treino" element={<ProtectedRoute><Treino /></ProtectedRoute>} />
      <Route path="/certificado" element={<ProtectedRoute><Certificado /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-ink-900 text-white">
        <AppRoutes />
      </div>
    </AuthProvider>
  );
}

export default App
