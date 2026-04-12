import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../api/client';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'developer';
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const data = await api.me();
      setUser(data.user);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.login({ email, password });
    setUser(data.user);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, login, logout, refresh }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
