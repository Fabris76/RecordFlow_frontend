import { createContext, useContext, useEffect, useState } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(authService.getStoredUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!authService.hasToken()) { setLoading(false); return () => { active = false; }; }
    authService.getCurrentUser().then((currentUser) => { if (active) setUser(currentUser); }).catch(() => { if (active) { authService.logout(); setUser(null); } }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const value = {
    user, loading, isAuthenticated: Boolean(user && authService.hasToken()),
    login: async (phone, password) => { const nextUser = await authService.login(phone, password); setUser(nextUser); return nextUser; },
    logout: () => { authService.logout(); setUser(null); }
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used inside AuthProvider'); return context; }
