import { useEffect, useState, type ReactNode } from 'react';
import { authenticateAccount } from '../api/accountRules';
import type { User } from '../types/auth';
import { readAccounts } from '../api/accounts';
import { apiData, apiUrl } from '../api/client';
import { expireSession, getTokens, mapProfile, saveTokens, type Tokens } from '../api/session';
import { AuthContext } from './auth';
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(() => { try { return JSON.parse(localStorage.getItem('sivet_user') || 'null'); } catch { if(apiUrl)expireSession(); return null; } });
  useEffect(() => { if (user) localStorage.setItem('sivet_user', JSON.stringify(user)); else localStorage.removeItem('sivet_user'); }, [user]);
  useEffect(() => {
    let live = true;
    const validate = async () => {
      if (!user) { setReady(true); return; }
      try {
        if (apiUrl) { if (!getTokens()) {if(live)setUser(null);return;} const profile = mapProfile(await apiData<{id_usuario:number;username:string;rol:string}>('/auth/me')); if(live && (profile.username !== user.username || profile.role !== user.role || profile.id !== user.id)) {setUser(profile);window.dispatchEvent(new Event('sivet-session'));}; return; }
        const accounts = await readAccounts();
        if (live && !accounts.some(a => a.username === user.username && a.role === user.role && a.active)) setUser(null);
      } catch { if (live) setUser(null); } finally { if (live) setReady(true); }
    };
    void validate(); window.addEventListener('storage', validate); window.addEventListener('sivet-accounts', validate);
    return () => { live = false; window.removeEventListener('storage', validate); window.removeEventListener('sivet-accounts', validate); };
  }, [user]);
  const login = async (username: string, password: string) => {
    try {
      if (apiUrl) { saveTokens(await apiData<Tokens>('/auth/login','POST',{username:username.trim(),password})); const profile = mapProfile(await apiData<{id_usuario:number;username:string;rol:string}>('/auth/me')); setUser(profile); window.dispatchEvent(new Event('sivet-session')); return profile; }
      const account = await authenticateAccount(await readAccounts(), username, password);
      if (!account) return null;
      setUser(account); return account;
    } catch (reason) { if(apiUrl){expireSession();throw reason;} return null; }
  };
  const logout = () => { const token=getTokens()?.refresh_token; if(apiUrl && token) void apiData('/auth/logout','POST',{refresh_token:token}).catch(() => {}); expireSession(); setUser(null); window.dispatchEvent(new Event('sivet-session')); };
  useEffect(() => { const expired = () => {setUser(null); window.dispatchEvent(new Event('sivet-session'));}; window.addEventListener('sivet-session-expired',expired); return () => window.removeEventListener('sivet-session-expired',expired); }, []);
  return <AuthContext.Provider value={{ user, isAuthenticated: ready && !!user, ready, login, logout }}>{children}</AuthContext.Provider>;
};
