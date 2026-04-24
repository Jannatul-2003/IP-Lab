import en from "./en";
import bn from "./bn";
import { Language } from "@/types";

export const translations = { en, bn };

export function t(lang: Language, key: string): string {
  const keys = key.split(".");
  let value: unknown = translations[lang];
  for (const k of keys) {
    if (typeof value === "object" && value !== null) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }
  return typeof value === "string" ? value : key;
}

export { en, bn };
