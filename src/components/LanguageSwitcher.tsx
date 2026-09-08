"use client";

import { Globe } from "lucide-react";
import { useLocale } from "@/i18n/LocaleProvider";
import { LOCALE_LABEL, type Locale } from "@/i18n/config";
import { useT } from "@/i18n/LocaleProvider";

// Two-language toggle. If a third locale is ever added, turn this into a menu.
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const t = useT();
  const next: Locale = locale === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      aria-label={t("common.language")}
      title={t("common.language")}
      className={`flex h-10 items-center gap-1.5 rounded-lg border border-white/15 px-2.5 text-sm font-semibold text-slate-300 transition hover:border-gold-400/40 hover:text-gold-400 ${className}`}
    >
      <Globe size={16} />
      {LOCALE_LABEL[next]}
    </button>
  );
}
