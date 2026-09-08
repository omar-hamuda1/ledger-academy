// UI language. Cookie-based (no URL segment): the switcher sets `locale` and
// the client LocaleProvider re-renders. Arabic is the default and the app's
// primary language; English is a partial translation added 2026-09-08 and
// rolled out area by area.
export const LOCALES = ["ar", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ar";
export const LOCALE_COOKIE = "locale";

export const LOCALE_LABEL: Record<Locale, string> = {
  ar: "العربية",
  en: "English",
};

export function dirOf(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
