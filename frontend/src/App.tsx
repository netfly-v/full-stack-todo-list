import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useMe } from './hooks/useAuth';
import AuthPanel from './components/AuthPanel';
import { TodosPage } from './components/TodosPage';
import { ProfilePage } from './components/ProfilePage';
import { AdminPage } from './components/AdminPage';
import { UserRole } from './types/admin';
import { getAssetUrl } from './utils/assetUrl';

function App() {
  const { data: user, isLoading: authLoading } = useMe();

  if (authLoading) {
    return (
      <div className="container">
        <div className="loading">🔄 Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container">
        <div className="header">
          <h1>📝 Todo App</h1>
          <p className="subtitle">Full Stack: React + TS + React Query + Express</p>
        </div>
        <AuthPanel />
      </div>
    );
  }

  return (
    <Router>
      <div className="container">
        <div className="header">
          <h1>📝 Todo App</h1>
          <p className="subtitle">Full Stack: React + TS + React Query + Express</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
            {user.avatar_url && (
              <img
                src={getAssetUrl(user.avatar_url) ?? undefined}
                alt="User avatar"
                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
              />
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600 }}>{user.name || user.email}</span>
              <span style={{ fontSize: '0.85rem', color: '#666' }}>{user.role || 'user'}</span>
            </div>
          </div>
          <nav style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <Link to="/" style={{ color: '#007bff', textDecoration: 'none' }}>Todos</Link>
            <Link to="/profile" style={{ color: '#007bff', textDecoration: 'none' }}>Profile</Link>
            {(user.role === UserRole.Admin || user.role === UserRole.Superadmin) && (
              <Link to="/admin" style={{ color: '#007bff', textDecoration: 'none' }}>Admin</Link>
            )}
          </nav>
        </div>

        <AuthPanel />

        <Routes>
          <Route path="/" element={<TodosPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          {(user.role === UserRole.Admin || user.role === UserRole.Superadmin) && <Route path="/admin" element={<AdminPage />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
