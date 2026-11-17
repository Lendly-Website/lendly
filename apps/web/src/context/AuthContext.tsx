import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import type { UserPublic } from "@lendly/shared";
import { request, setAuthToken } from "../utils/api";

interface AuthContextValue {
  user: UserPublic | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserPublic>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    location?: { address: string; locality: string; city: string; latitude: number; longitude: number };
  }) => Promise<UserPublic>;
  logout: (redirectTo?: string) => void;
  refreshUser: () => Promise<void>;
  setUser: (user: UserPublic) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthData {
  token: string;
  user: UserPublic;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    async function restore() {
      if (!localStorage.getItem("lendly_token")) {
        setLoading(false);
        return;
      }
      try {
        const data = await request<{ data: UserPublic }>("/api/auth/me");
        if (active) setUserState(data.data);
      } catch {
        setAuthToken(null);
        if (active) setUserState(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    void restore();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await request<{ data: AuthData }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(data.data.token);
    setUserState(data.data.user);
    return data.data.user;
  }, []);

  const register = useCallback(
    async (payload: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      location?: { address: string; locality: string; city: string; latitude: number; longitude: number };
    }) => {
      const data = await request<{ data: AuthData }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setAuthToken(data.data.token);
      setUserState(data.data.user);
      return data.data.user;
    },
    [],
  );

  const logout = useCallback(
    (redirectTo = "/") => {
      setAuthToken(null);
      setUserState(null);
      navigate(redirectTo, { replace: true });
    },
    [navigate],
  );

  const refreshUser = useCallback(async () => {
    const data = await request<{ data: UserPublic }>("/api/auth/me");
    setUserState(data.data);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshUser, setUser: setUserState }),
    [user, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
