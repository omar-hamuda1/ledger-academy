"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { GraduationCap, Menu, X, LogOut, LayoutDashboard } from "lucide-react";

const navLinks = [
  { href: "/#home", label: "الرئيسية" },
  { href: "/#courses", label: "الكورسات" },
  { href: "/#about", label: "عن المحاضر" },
  { href: "/#contact", label: "تواصل معنا" },
];

export function LedgerHeader() {
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();
  const dashboardHref = session?.user.role === "ADMIN" ? "/dashboard/admin" : "/dashboard/student";

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-navy-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-400 text-navy-950">
            <GraduationCap size={20} />
          </span>
          <span className="text-lg font-extrabold text-white">
            Ledger <span className="text-gold-400">Academy</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="transition hover:text-gold-400">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {status === "authenticated" ? (
            <>
              <Link
                href={dashboardHref}
                className="flex items-center gap-2 rounded-lg border border-gold-400/40 px-4 py-2.5 text-sm font-bold text-gold-300 transition hover:bg-gold-400/10"
              >
                <LayoutDashboard size={16} />
                مرحبًا، {session.user.name?.split(" ")[0]}
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                aria-label="تسجيل الخروج"
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
              تسجيل الدخول
            </Link>
          )}
        </div>

        <button
          type="button"
          aria-label="فتح القائمة"
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
              className="rounded-lg px-2 py-3 transition hover:bg-white/5 hover:text-gold-400"
            >
              {link.label}
            </a>
          ))}
          {status === "authenticated" ? (
            <>
              <Link
                href={dashboardHref}
                onClick={() => setOpen(false)}
                className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-gold-400/40 px-5 py-3 text-center font-bold text-gold-300"
              >
                <LayoutDashboard size={16} />
                مرحبًا، {session.user.name?.split(" ")[0]}
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
                تسجيل الخروج
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg bg-gold-400 px-5 py-3 text-center font-bold text-navy-950"
            >
              تسجيل الدخول
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
