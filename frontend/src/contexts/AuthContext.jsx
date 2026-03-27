import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('astra_token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('astra_token');
          delete api.defaults.headers.common['Authorization'];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    // Try backend first
    try {
      const res = await api.post('/auth/login', { email, password });
      const { access_token, user: userData } = res.data;
      localStorage.setItem('astra_token', access_token);
      localStorage.setItem('astra_onboarded', 'true');
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(userData);
      return userData;
    } catch {
      // Fallback: admin login when backend is unavailable
      if (email === 'admin@astra.ai' && password === 'Astra2026!') {
        const adminUser = {
          id: 'admin-001',
          email: 'admin@astra.ai',
          full_name: 'Craig Canty',
          role: 'partner',
        };
        localStorage.setItem('astra_token', 'admin-local-token');
        localStorage.setItem('astra_onboarded', 'true');
        setUser(adminUser);
        return adminUser;
      }
      throw new Error('Invalid email or password');
    }
  };

  const register = async (email, password, full_name, role = 'bookkeeper') => {
    try {
      const res = await api.post('/auth/register', { email, password, full_name, role });
      const { access_token, user: userData } = res.data;
      localStorage.setItem('astra_token', access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(userData);
      return userData;
    } catch (err) {
      // If backend is down, offer demo mode
      if (err.response?.status === 500 || !err.response) {
        throw new Error('Backend unavailable. Use "Enter Demo Mode" below to preview the dashboard.');
      }
      throw err;
    }
  };

  const loginDemo = () => {
    const demoUser = {
      id: 'demo-user',
      email: 'demo@astra.ai',
      full_name: 'Demo User',
      role: 'partner',
    };
    localStorage.setItem('astra_token', 'demo-token');
    localStorage.setItem('astra_onboarded', 'true');
    setUser(demoUser);
    return demoUser;
  };

  const logout = () => {
    localStorage.removeItem('astra_token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loginDemo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
