"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, ShieldCheck } from "lucide-react";
import { AuthLayout, AuthFormCard, AuthError, OtpCodeField } from "@/components/auth/AuthLayout";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { useT } from "@/i18n/LocaleProvider";

export default function RegisterPage() {
  const router = useRouter();
  const t = useT();
  const [step, setStep] = useState<"info" | "verify">("info");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, purpose: "SIGNUP" }),
    });
    const data = await res.json().catch(() => ({}));

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? t("auth.register.sendCodeError"));
      return;
    }

    setStep("verify");
  }

  async function handleVerifyAndRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const verifyRes = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, purpose: "SIGNUP", code }),
    });
    const verifyData = await verifyRes.json().catch(() => ({}));

    if (!verifyRes.ok) {
      setLoading(false);
      setError(verifyData.error ?? t("auth.register.otpError"));
      return;
    }

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? t("auth.genericError"));
      return;
    }

    // Account created — log them straight in instead of sending them to /login.
    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (signInResult?.error) {
      // Account exists but auto-login failed for some reason — fall back to the login page.
      router.push("/login");
      return;
    }

    const session = await getSession();
    const role = (session?.user as { role?: string } | undefined)?.role;

    router.push(role === "ADMIN" ? "/dashboard/admin" : "/dashboard/student");
  }

  return (
    <AuthLayout
      icon={step === "info" ? <UserPlus size={22} /> : <ShieldCheck size={22} />}
      title={step === "info" ? t("auth.register.infoTitle") : t("auth.register.verifyTitle")}
      subtitle={
        step === "info"
          ? t("auth.register.infoSubtitle")
          : t("auth.register.verifySubtitle", { email })
      }
    >
      {step === "info" ? (
        <AuthFormCard onSubmit={handleSendCode}>
          <AuthError message={error} />

          <div>
            <label className="mb-1.5 block text-sm text-slate-300">{t("auth.register.name")}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-white/15 bg-navy-950 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-gold-400 focus:outline-none"
              placeholder={t("auth.register.namePlaceholder")}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-slate-300">{t("common.email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-white/15 bg-navy-950 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-gold-400 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-slate-300">{t("common.password")}</label>
            <PasswordInput
              value={password}
              onChange={setPassword}
              minLength={8}
              autoComplete="new-password"
              ariaLabel={t("common.password")}
              placeholder={t("auth.register.passwordPlaceholder")}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gold-400 py-2.5 font-bold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
          >
            {loading ? t("auth.register.sending") : t("auth.register.sendCode")}
          </button>

          <p className="text-center text-xs text-slate-400">
            {t("auth.register.consentPrefix")}{" "}
            <Link href="/terms" className="text-gold-400 underline">
              {t("auth.register.terms")}
            </Link>{" "}
            {t("auth.register.and")}{" "}
            <Link href="/privacy" className="text-gold-400 underline">
              {t("auth.register.privacy")}
            </Link>
            .
          </p>

          <p className="text-center text-sm text-slate-400">
            {t("auth.register.haveAccount")}{" "}
            <Link href="/login" className="font-semibold text-gold-400 underline">
              {t("common.login")}
            </Link>
          </p>
        </AuthFormCard>
      ) : (
        <AuthFormCard onSubmit={handleVerifyAndRegister}>
          <AuthError message={error} />

          <OtpCodeField value={code} onChange={setCode} />

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full rounded-lg bg-gold-400 py-2.5 font-bold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
          >
            {loading ? t("auth.register.confirming") : t("auth.register.confirmCreate")}
          </button>

          <button
            type="button"
            onClick={() => setStep("info")}
            className="w-full text-center text-sm text-slate-400 hover:text-gold-400"
          >
            {t("auth.register.editInfo")}
          </button>
        </AuthFormCard>
      )}
    </AuthLayout>
  );
}
