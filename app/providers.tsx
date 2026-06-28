"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, Language } from "@/types";
import { getStoredUser, clearAuth, hasRole } from "@/lib/auth";
import { translations } from "@/i18n";
import { UserRole } from "@/types";

export type Theme = "light" | "dark";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "notice" | "event" | "election" | "system";
  read: boolean;
  createdAt: string;
}

interface AuthCtx {
  user: User | null;
  isLoading: boolean;
  setUser: (u: User | null) => void;
  logout: () => void;
  can: (role: UserRole) => boolean;
}

interface LangCtx {
  lang: Language;
  setLang: (l: Language) => void;
  toggle: () => void;
  t: (key: string) => string;
}

interface ThemeCtx {
  theme: Theme;
  toggleTheme: () => void;
}

interface NotifCtx {
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  addNotification: (n: Omit<AppNotification, "id" | "read" | "createdAt">) => void;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  isLoading: true,
  setUser: () => {},
  logout: () => {},
  can: () => false,
});

const LangContext = createContext<LangCtx>({
  lang: "en",
  setLang: () => {},
  toggle: () => {},
  t: (k) => k,
});

const ThemeContext = createContext<ThemeCtx>({
  theme: "light",
  toggleTheme: () => {},
});

const NotifContext = createContext<NotifCtx>({
  notifications: [],
  unreadCount: 0,
  markRead: () => {},
  markAllRead: () => {},
  addNotification: () => {},
});

export function useAuthContext() { return useContext(AuthContext); }
export function useLang() { return useContext(LangContext); }
export function useTheme() { return useContext(ThemeContext); }
export function useNotifications() { return useContext(NotifContext); }

const MOCK_NOTIFICATIONS: AppNotification[] = [
  { id: "n1", title: "New Notice Posted", message: "Term 8 EC election dates announced.", type: "election", read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "n2", title: "Event Reminder", message: "Tech Talk with ML starts tomorrow at 3 PM.", type: "event", read: false, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: "n3", title: "Membership Approved", message: "Your membership application has been approved.", type: "notice", read: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
];

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lang, setLangState] = useState<Language>("en");
  const [theme, setThemeState] = useState<Theme>("light");
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);

  useEffect(() => {
    const stored = getStoredUser();
    setUserState(stored);
    setIsLoading(false);

    try {
      // Restore language preference
      const storedLang = localStorage.getItem("csedusc_lang") as Language | null;
      if (storedLang === "en" || storedLang === "bn") setLangState(storedLang);

      // Restore theme preference
      const storedTheme = localStorage.getItem("csedusc_theme") as Theme | null;
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const resolved = storedTheme ?? (prefersDark ? "dark" : "light");
      setThemeState(resolved);
    } catch (e) {
      // localStorage not accessible (sandboxed iframe, cross-origin, etc)
    }
  }, []);

  // Apply dark class to <html> whenever theme changes
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem("csedusc_theme", theme);
    } catch {
      // localStorage not accessible
    }
  }, [theme]);

  // Apply lang attribute for correct font rendering
  useEffect(() => {
    document.documentElement.lang = lang === "bn" ? "bn" : "en";
  }, [lang]);

  function setUser(u: User | null) { setUserState(u); }

  function logout() {
    fetch("/api/auth/logout", { method: "POST" }).finally(() => {
      clearAuth();
      setUserState(null);
      window.location.href = "/";
    });
  }

  function can(role: UserRole): boolean {
    if (!user) return false;
    return hasRole(user.role, role);
  }

  function setLang(l: Language) {
    setLangState(l);
    try {
      localStorage.setItem("csedusc_lang", l);
    } catch {
      // localStorage not accessible
    }
  }

  function toggle() { setLang(lang === "en" ? "bn" : "en"); }

  function t(key: string): string {
    const dict = translations[lang];
    const keys = key.split(".");
    let value: unknown = dict;
    for (const k of keys) {
      if (typeof value === "object" && value !== null) {
        value = (value as Record<string, unknown>)[k];
      } else return key;
    }
    return typeof value === "string" ? value : key;
  }

  function toggleTheme() {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  }

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const addNotification = useCallback((n: Omit<AppNotification, "id" | "read" | "createdAt">) => {
    const newN: AppNotification = {
      ...n,
      id: `n${Date.now()}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newN, ...prev]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, logout, can }}>
      <LangContext.Provider value={{ lang, setLang, toggle, t }}>
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
          <NotifContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, addNotification }}>
            {children}
          </NotifContext.Provider>
        </ThemeContext.Provider>
      </LangContext.Provider>
    </AuthContext.Provider>
  );
}
