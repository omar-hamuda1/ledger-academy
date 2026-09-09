"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { GraduationCap, Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { useT } from "@/i18n/LocaleProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { MessageKey } from "@/i18n/translate";

const navLinks: { href: string; key: MessageKey; brief: MessageKey }[] = [
  { href: "/#home", key: "nav.home", brief: "nav.home.brief" },
  { href: "/#courses", key: "nav.courses", brief: "nav.courses.brief" },
  { href: "/#about", key: "nav.about", brief: "nav.about.brief" },
  { href: "/#contact", key: "nav.contact", brief: "nav.contact.brief" },
];

export function LedgerHeader() {
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();
  const t = useT();
  const dashboardHref = session?.user.role === "ADMIN" ? "/dashboard/admin" : "/dashboard/student";
  // A logged-in student's "home" is their dashboard, not the marketing page.
  const logoHref = session && session.user.role !== "ADMIN" ? dashboardHref : "/";

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-navy-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href={logoHref} className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-400 text-navy-950">
            <GraduationCap size={20} />
          </span>
          <span className="text-lg font-extrabold text-white">
            Ledger <span className="text-gold-400">Academy</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex">
          {navLinks.map((link) => (
            <div key={link.href} className="group relative">
              <a
                href={link.href}
                className="inline-flex items-center py-1 transition hover:text-gold-400 group-focus-within:text-gold-400"
              >
                {t(link.key)}
              </a>
              {/* hover / focus brief */}
              <div className="pointer-events-none absolute start-0 top-full z-40 w-64 max-w-[calc(100vw-3rem)] translate-y-1 pt-3 opacity-0 transition duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <div className="rounded-xl border border-white/10 bg-navy-900 p-3.5 text-xs font-normal leading-relaxed text-slate-300 shadow-elevated">
                  {t(link.brief)}
                </div>
              </div>
            </div>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          {status === "authenticated" ? (
            <>
              <Link
                href={dashboardHref}
                className="flex items-center gap-2 rounded-lg border border-gold-400/40 px-4 py-2.5 text-sm font-bold text-gold-300 transition hover:bg-gold-400/10"
              >
                <LayoutDashboard size={16} />
                {t("header.greeting", { name: session.user.name?.split(" ")[0] ?? "" })}
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                aria-label={t("common.logout")}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-slate-300 transition hover:border-red-400/40 hover:text-red-400"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : status === "loading" ? (
            <span className="h-10 w-28 animate-pulse rounded-lg bg-white/5" />
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-gold-400 px-5 py-2.5 text-sm font-bold text-navy-950 transition hover:bg-gold-300"
            >
              {t("common.login")}
            </Link>
          )}
        </div>

        <button
          type="button"
          aria-label={t("header.openMenu")}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white md:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-white/10 px-6 py-4 text-sm font-medium text-slate-300 md:hidden">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-2.5 transition hover:bg-white/5 hover:text-gold-400"
            >
              {t(link.key)}
              <span className="mt-0.5 block text-[11px] font-normal text-slate-500">
                {t(link.brief)}
              </span>
            </a>
          ))}
          <div className="px-2 py-3">
            <LanguageSwitcher />
          </div>
          {status === "authenticated" ? (
            <>
              <Link
                href={dashboardHref}
                onClick={() => setOpen(false)}
                className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-gold-400/40 px-5 py-3 text-center font-bold text-gold-300"
              >
                <LayoutDashboard size={16} />
                {t("header.greeting", { name: session.user.name?.split(" ")[0] ?? "" })}
              </Link>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="flex items-center justify-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-center font-bold text-slate-300"
              >
                <LogOut size={16} />
                {t("common.logout")}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg bg-gold-400 px-5 py-3 text-center font-bold text-navy-950"
            >
              {t("common.login")}
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
