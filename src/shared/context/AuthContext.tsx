import { useEffect, useState, type ReactNode } from 'react';
import { authenticateAccount } from '../api/accountRules';
import type { Role, User } from '../types/auth';
import { readAccounts } from '../api/accounts';
import { apiClient, apiUrl } from '../api/client';
import { AuthContext } from './auth';
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(() => { try { return JSON.parse(localStorage.getItem('sivet_user') || 'null'); } catch { return null; } });
  useEffect(() => { if (user) localStorage.setItem('sivet_user', JSON.stringify(user)); else localStorage.removeItem('sivet_user'); }, [user]);
  useEffect(() => {
    let live = true;
    const validate = async () => {
      if (!user) { setReady(true); return; }
      try {
        if (apiUrl) { const response = await apiClient.get<User>('/auth/me'); if (response.data.username !== user.username || response.data.role !== user.role) { if (live) setUser(null); } return; }
        const accounts = await readAccounts();
        if (live && !accounts.some(a => a.username === user.username && a.role === user.role && a.active)) setUser(null);
      } catch { if (live) setUser(null); } finally { if (live) setReady(true); }
    };
    void validate(); window.addEventListener('storage', validate); window.addEventListener('sivet-accounts', validate);
    return () => { live = false; window.removeEventListener('storage', validate); window.removeEventListener('sivet-accounts', validate); };
  }, [user]);
  const login = async (username: string, password: string, role: Role) => {
    try {
      if (apiUrl) { const response = await apiClient.post<User>('/auth/login', { username: username.trim(), password }); if (response.data.role !== role) return false; setUser(response.data); return true; }
      const account = await authenticateAccount(await readAccounts(), username, password, role);
      if (!account) return false;
      setUser(account); return true;
    } catch { return false; }
  };
  const logout = () => { if (apiUrl) void apiClient.post('/auth/logout').catch(() => {}); setUser(null); };
  return <AuthContext.Provider value={{ user, isAuthenticated: ready && !!user, ready, login, logout }}>{children}</AuthContext.Provider>;
};
