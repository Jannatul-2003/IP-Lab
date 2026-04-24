"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Language } from "@/types";
import { getStoredUser, clearAuth, hasRole } from "@/lib/auth";
import { translations } from "@/i18n";
import { UserRole } from "@/types";

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

export function useAuthContext() {
  return useContext(AuthContext);
}

export function useLang() {
  return useContext(LangContext);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    const stored = getStoredUser();
    setUserState(stored);
    setIsLoading(false);
    const storedLang = localStorage.getItem("csedusc_lang") as Language | null;
    if (storedLang === "en" || storedLang === "bn") setLangState(storedLang);
  }, []);

  function setUser(u: User | null) {
    setUserState(u);
  }

  function logout() {
    clearAuth();
    setUserState(null);
    window.location.href = "/";
  }

  function can(role: UserRole): boolean {
    if (!user) return false;
    return hasRole(user.role, role);
  }

  function setLang(l: Language) {
    setLangState(l);
    localStorage.setItem("csedusc_lang", l);
  }

  function toggle() {
    setLang(lang === "en" ? "bn" : "en");
  }

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

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, logout, can }}>
      <LangContext.Provider value={{ lang, setLang, toggle, t }}>
        {children}
      </LangContext.Provider>
    </AuthContext.Provider>
  );
}
