import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { Role, User } from "../types/auth";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string, role: Role) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("sivet_user");

    if (!savedUser) {
      return null;
    }

    return JSON.parse(savedUser);
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("sivet_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("sivet_user");
    }
  }, [user]);

  const login = (
    username: string,
    password: string,
    role: Role
  ): boolean => {
    if (!username || !password || !role) {
      return false;
    }

    const loggedUser: User = {
      username,
      role,
    };

    setUser(loggedUser);

    return true;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de AuthProvider");
  }

  return context;
};