"use client";
import { useState, useEffect, useCallback } from "react";
import { Language } from "@/types";
import { translations } from "@/i18n";

const STORAGE_KEY = "csedusc_lang";

export function useLanguage() {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored === "en" || stored === "bn") setLangState(stored);
  }, []);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const toggle = useCallback(() => {
    setLang(lang === "en" ? "bn" : "en");
  }, [lang, setLang]);

  const dict = translations[lang];

  function t(key: string): string {
    const keys = key.split(".");
    let value: unknown = dict;
    for (const k of keys) {
      if (typeof value === "object" && value !== null) {
        value = (value as Record<string, unknown>)[k];
      } else return key;
    }
    return typeof value === "string" ? value : key;
  }

  return { lang, setLang, toggle, t, dict };
}
