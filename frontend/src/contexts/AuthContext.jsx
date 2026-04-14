import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

// Admin user — works without backend
const ADMIN_EMAIL = 'admin@davenroe.com';
const ADMIN_PASSWORD = 'DavenRoe2026!';
const ADMIN_USER = {
  id: 'admin-001',
  email: ADMIN_EMAIL,
  full_name: 'Craig Canty',
  role: 'partner',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('davenroe_token');
    if (!token) {
      setLoading(false);
      return;
    }

    // Admin token — no backend needed
    if (token === 'admin-local-token') {
      setUser(ADMIN_USER);
      setLoading(false);
      return;
    }

    // Real token — verify with backend
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    api.get('/auth/me')
      .then(res => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('davenroe_token');
        localStorage.removeItem('davenroe_onboarded');
        delete api.defaults.headers.common['Authorization'];
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    // Admin login — works without backend
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem('davenroe_token', 'admin-local-token');
      localStorage.setItem('davenroe_onboarded', 'true');
      setUser(ADMIN_USER);
      return ADMIN_USER;
    }

    // Real login via backend
    const res = await api.post('/auth/login', { email, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('davenroe_token', access_token);
    localStorage.setItem('davenroe_onboarded', 'true');
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setUser(userData);
    return userData;
  };

  const register = async (email, password, full_name, role = 'bookkeeper') => {
    // Admin login works on register form too
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem('davenroe_token', 'admin-local-token');
      localStorage.setItem('davenroe_onboarded', 'true');
      setUser(ADMIN_USER);
      return ADMIN_USER;
    }

    const res = await api.post('/auth/register', { email, password, full_name, role });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('davenroe_token', access_token);
    localStorage.setItem('davenroe_onboarded', 'true');
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('davenroe_token');
    localStorage.removeItem('davenroe_onboarded');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
