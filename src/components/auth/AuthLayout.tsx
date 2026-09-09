"use client";

import type { ReactNode } from "react";
import { LedgerHeader } from "@/components/ledger-academy/LedgerHeader";
import { useT } from "@/i18n/LocaleProvider";


export function AuthLayout({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-navy-950 text-slate-100">
      <LedgerHeader />

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold-400/10 text-gold-400">
              {icon}
            </span>
            <h1 className="text-2xl font-extrabold text-white">{title}</h1>
            <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}

export function AuthFormCard({
  onSubmit,
  children,
}: {
  onSubmit: (e: React.FormEvent) => void;
  children: ReactNode;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-card border border-white/10 bg-navy-900/60 p-6 shadow-card animate-slide-up">
      {children}
    </form>
  );
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{message}</p>;
}

export function OtpCodeField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const t = useT();
  return (
    <div>
      <label className="mb-1.5 block text-sm text-slate-300">{t("auth.otpLabel")}</label>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        required
        maxLength={6}
        dir="ltr"
        className="w-full rounded-lg border border-white/15 bg-navy-950 px-3 py-2.5 text-center text-lg tracking-[0.5em] text-white placeholder:text-slate-500 focus:border-gold-400 focus:outline-none"
        placeholder="000000"
      />
    </div>
  );
}
