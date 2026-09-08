"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, ShieldCheck } from "lucide-react";
import { AuthLayout, AuthFormCard, AuthError, OtpCodeField } from "@/components/auth/AuthLayout";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { useT } from "@/i18n/LocaleProvider";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const t = useT();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, purpose: "RESET" }),
    });
    const data = await res.json().catch(() => ({}));

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? t("auth.forgot.sendCodeError"));
      return;
    }

    setStep("reset");
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("auth.forgot.mismatch"));
      return;
    }

    setLoading(true);

    const verifyRes = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, purpose: "RESET", code }),
    });
    const verifyData = await verifyRes.json().catch(() => ({}));

    if (!verifyRes.ok) {
      setLoading(false);
      setError(verifyData.error ?? t("auth.forgot.otpError"));
      return;
    }

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? t("auth.forgot.resetError"));
      return;
    }

    router.push("/login");
  }

  return (
    <AuthLayout
      icon={step === "email" ? <KeyRound size={22} /> : <ShieldCheck size={22} />}
      title={step === "email" ? t("auth.forgot.emailTitle") : t("auth.forgot.resetTitle")}
      subtitle={
        step === "email"
          ? t("auth.forgot.emailSubtitle")
          : t("auth.forgot.resetSubtitle", { email })
      }
    >
      {step === "email" ? (
        <AuthFormCard onSubmit={handleSendCode}>
          <AuthError message={error} />

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

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gold-400 py-2.5 font-bold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
          >
            {loading ? t("auth.forgot.sending") : t("auth.forgot.sendCode")}
          </button>

          <p className="text-center text-sm text-slate-400">
            {t("auth.forgot.remembered")}{" "}
            <Link href="/login" className="font-semibold text-gold-400 hover:underline">
              {t("common.login")}
            </Link>
          </p>
        </AuthFormCard>
      ) : (
        <AuthFormCard onSubmit={handleReset}>
          <AuthError message={error} />

          <OtpCodeField value={code} onChange={setCode} />

          <div>
            <label className="mb-1.5 block text-sm text-slate-300">{t("auth.forgot.newPassword")}</label>
            <PasswordInput
              value={password}
              onChange={setPassword}
              minLength={8}
              autoComplete="new-password"
              ariaLabel={t("auth.forgot.newPassword")}
              placeholder={t("auth.forgot.newPasswordPlaceholder")}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-slate-300">{t("auth.forgot.confirmPassword")}</label>
            <PasswordInput
              value={confirmPassword}
              onChange={setConfirmPassword}
              minLength={8}
              autoComplete="new-password"
              ariaLabel={t("auth.forgot.confirmPassword")}
              placeholder={t("auth.forgot.confirmPasswordPlaceholder")}
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full rounded-lg bg-gold-400 py-2.5 font-bold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
          >
            {loading ? t("auth.forgot.submitting") : t("auth.forgot.submit")}
          </button>

          <button
            type="button"
            onClick={() => setStep("email")}
            className="w-full text-center text-sm text-slate-400 hover:text-gold-400"
          >
            {t("auth.forgot.changeEmail")}
          </button>
        </AuthFormCard>
      )}
    </AuthLayout>
  );
}
