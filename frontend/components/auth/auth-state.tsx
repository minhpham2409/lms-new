"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { setAccessToken } from "@/lib/api-service";

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
    // Attempt to hydrate token silently using the httpOnly cookie on mount
    const hydrate = async () => {
      try {
        const { authApi } = await import('@/lib/api-service');
        const data = await authApi.refreshToken();
        if (data && data.access_token) {
          const decoded = decodeJwt(data.access_token);
          if (decoded && decoded.exp * 1000 > Date.now()) {
            setAccessToken(data.access_token);
            setToken(data.access_token);
            setUser({
              id: decoded.sub,
              username: decoded.username,
              email: decoded.email,
              role: decoded.role,
              firstName: decoded.firstName,
              lastName: decoded.lastName,
            });
          }
        }
      } catch {
        // If refresh fails, it means no valid cookie, user is logged out
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    };
    
    hydrate();
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

  const logout = useCallback(async () => {
    if (token) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch {}
    }
    setAccessToken(null);
    localStorage.removeItem("refreshToken");
    setToken(null);
    setUser(null);
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn: !!user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
