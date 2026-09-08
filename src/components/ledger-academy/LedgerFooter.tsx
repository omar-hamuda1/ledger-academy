"use client";

import { GraduationCap } from "lucide-react";
import { FacebookIcon, InstagramIcon, YoutubeIcon } from "./SocialIcons";
import { useT } from "@/i18n/LocaleProvider";
import type { MessageKey } from "@/i18n/translate";

const navLinks: { href: string; key: MessageKey }[] = [
  { href: "/#home", key: "nav.home" },
  { href: "/#courses", key: "nav.courses" },
  { href: "/#about", key: "nav.about" },
  { href: "/#contact", key: "nav.contact" },
];

export function LedgerFooter() {
  const t = useT();
  return (
    <footer className="border-t border-white/10 bg-navy-950">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-400 text-navy-950">
              <GraduationCap size={20} />
            </span>
            <span className="text-lg font-extrabold text-white">
              Ledger <span className="text-gold-400">Academy</span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
            {t("footer.tagline")}
          </p>
        </div>

        <div>
          <h3 className="mb-4 font-bold text-white">{t("footer.quickLinks")}</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="transition hover:text-gold-400">
                  {t(link.key)}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-bold text-white">{t("footer.followUs")}</h3>
          <div className="flex items-center gap-3">
            <a
              href="#"
              aria-label="Facebook"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-slate-300 transition hover:bg-gold-400 hover:text-navy-950"
            >
              <FacebookIcon size={18} />
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-slate-300 transition hover:bg-gold-400 hover:text-navy-950"
            >
              <InstagramIcon size={18} />
            </a>
            <a
              href="#"
              aria-label="Youtube"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-slate-300 transition hover:bg-gold-400 hover:text-navy-950"
            >
              <YoutubeIcon size={18} />
            </a>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 border-t border-white/10 py-6 text-center text-sm text-slate-400 sm:flex-row sm:justify-between sm:px-6">
        <span>{t("footer.rights", { year: new Date().getFullYear() })}</span>
        <div className="flex items-center gap-4">
          <a href="/privacy" className="transition hover:text-gold-400">
            {t("footer.privacy")}
          </a>
          <a href="/terms" className="transition hover:text-gold-400">
            {t("footer.terms")}
          </a>
        </div>
      </div>
    </footer>
  );
}
