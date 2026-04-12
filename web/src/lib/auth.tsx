import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { customFetch, setAuthTokenGetter } from "../api/client";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  authProvider?: string | null;
}

export interface OrganizationMembership {
  id: string;
  orgId: string;
  role: "admin" | "mod" | "dev" | "viewer";
  status: "invited" | "active" | "suspended";
  joinedAt: string | null;
  organization: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
  } | null;
}

interface AuthSessionResponse {
  token?: string;
  user: User | null;
  organizationMemberships: OrganizationMembership[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  organizationMemberships: OrganizationMembership[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TOKEN_STORAGE_KEY = "synkrypt-auth-token";

async function loadSession(): Promise<AuthSessionResponse> {
  return customFetch<AuthSessionResponse>("/api/auth/session", {
    responseType: "json",
  });
}

async function loginRequest(email: string, password: string): Promise<AuthSessionResponse> {
  return customFetch<AuthSessionResponse>("/api/auth/login", {
    method: "POST",
    responseType: "json",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
}

async function registerRequest(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthSessionResponse> {
  return customFetch<AuthSessionResponse>("/api/auth/register", {
    method: "POST",
    responseType: "json",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

async function logoutRequest(): Promise<void> {
  await customFetch("/api/auth/logout", {
    method: "POST",
    responseType: "json",
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY),
  );
  const [organizationMemberships, setOrganizationMemberships] = useState<
    OrganizationMembership[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setAuthTokenGetter(() => token);
    return () => setAuthTokenGetter(null);
  }, [token]);

  const applySession = (session: AuthSessionResponse) => {
    setUser(session.user);
    setOrganizationMemberships(session.organizationMemberships);
    if (session.token) {
      setToken(session.token);
      localStorage.setItem(TOKEN_STORAGE_KEY, session.token);
    }
    if (!session.user && !session.token) {
      setToken(null);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  };

  const refreshSession = async () => {
    const session = await loadSession();
    applySession(session);
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const session = await loadSession();
        if (isMounted) {
          applySession(session);
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setOrganizationMemberships([]);
          setToken(null);
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const session = await loginRequest(email, password);
    applySession(session);
  };

  const register = async (input: {
    name: string;
    email: string;
    password: string;
  }) => {
    const session = await registerRequest(input);
    applySession(session);
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
      setOrganizationMemberships([]);
      setToken(null);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  };

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      organizationMemberships,
      isLoading,
      login,
      register,
      logout,
      refreshSession,
    }),
    [user, token, organizationMemberships, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
