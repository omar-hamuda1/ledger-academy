"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { DEFAULT_LOCALE, LOCALE_COOKIE, dirOf, isLocale, type Locale } from "./config";
import { makeT, type TFunction } from "./translate";

type Ctx = {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: TFunction;
  setLocale: (next: Locale) => void;
};

const LocaleContext = createContext<Ctx | null>(null);

// The locale lives in a cookie; the switcher writes it and notifies subscribers.
const listeners = new Set<() => void>();

function readLocale(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const m = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
  return m && isLocale(m[1]) ? m[1] : DEFAULT_LOCALE;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const serverSnapshot = () => DEFAULT_LOCALE;

function writeLocale(next: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  listeners.forEach((cb) => cb());
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // Server + hydration snapshot is the default; the cookie value takes over
  // right after hydration (no mismatch, because getServerSnapshot is used for
  // the first client render too).
  const locale = useSyncExternalStore(subscribe, readLocale, serverSnapshot);

  // Keep the document element in sync (an external system — not React state).
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dirOf(locale);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => writeLocale(next), []);

  const value = useMemo<Ctx>(
    () => ({ locale, dir: dirOf(locale), t: makeT(locale), setLocale }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

function useLocaleCtx(): Ctx {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useT/useLocale must be used within <LocaleProvider>");
  return ctx;
}

/** Translation function for the current UI language. */
export function useT(): TFunction {
  return useLocaleCtx().t;
}

/** Current locale + direction + a setter (for the language switcher). */
export function useLocale(): { locale: Locale; dir: "rtl" | "ltr"; setLocale: (next: Locale) => void } {
  const { locale, dir, setLocale } = useLocaleCtx();
  return { locale, dir, setLocale };
}
