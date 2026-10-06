import { createContext, useContext } from 'react';
import type { Role, User } from '../types/auth';
interface AuthContextType {
  user: User | null;
  ready: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string, role: Role) => Promise<boolean>;
  logout: () => void;
}
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe utilizarse dentro de AuthProvider');
  return context;
};
