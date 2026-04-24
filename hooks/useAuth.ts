"use client";
import { useState, useEffect, useCallback } from "react";
import { User, UserRole } from "@/types";
import { getStoredUser, setStoredUser, clearAuth, hasRole } from "@/lib/auth";
import { authApi } from "@/lib/api";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    const stored = getStoredUser();
    setState({ user: stored, isLoading: false, isAuthenticated: !!stored });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password) as { accessToken: string; user: User };
    setStoredUser(res.user, res.accessToken);
    setState({ user: res.user, isLoading: false, isAuthenticated: true });
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  const can = useCallback(
    (requiredRole: UserRole) => {
      if (!state.user) return false;
      return hasRole(state.user.role, requiredRole);
    },
    [state.user]
  );

  return { ...state, login, logout, can };
}
