"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { setAccessToken, getAccessToken } from "@/lib/api-service";

interface UserInfo {
  id: string;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  user: UserInfo | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (token: string, refreshToken?: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null, token: null, isLoggedIn: false, login: () => {}, logout: () => {}, loading: true,
});

export function useAuth() { return useContext(AuthContext); }

function decodeJwt(token: string): any {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch { return null; }
}

export function AuthStateProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hydrate from localStorage on mount (access token still persisted for SSR compat)
    const saved = getAccessToken();
    if (saved) {
      const decoded = decodeJwt(saved);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setToken(saved);
        setUser({
          id: decoded.sub,
          username: decoded.username,
          email: decoded.email,
          role: decoded.role,
          firstName: decoded.firstName,
          lastName: decoded.lastName,
        });
      } else {
        setAccessToken(null);
        localStorage.removeItem("refreshToken");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((accessToken: string, _refreshToken?: string) => {
    setAccessToken(accessToken);
    // refreshToken is now handled via HttpOnly cookie, no need to store in localStorage
    const decoded = decodeJwt(accessToken);
    if (decoded) {
      setToken(accessToken);
      setUser({
        id: decoded.sub,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
      });
    }
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    localStorage.removeItem("refreshToken");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn: !!user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
