"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, ShieldCheck } from "lucide-react";
import { AuthLayout, AuthFormCard, AuthError, OtpCodeField } from "@/components/auth/AuthLayout";

export default function RegisterPage() {
  const router = useRouter();
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
      setError(data.error ?? "تعذّر إرسال رمز التحقق.");
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
      setError(verifyData.error ?? "رمز التحقق غير صحيح.");
      return;
    }

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json().catch(() => ({}));

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "حدث خطأ ما، حاول مرة أخرى.");
      return;
    }

    router.push("/login");
  }

  return (
    <AuthLayout
      icon={step === "info" ? <UserPlus size={22} /> : <ShieldCheck size={22} />}
      title={step === "info" ? "إنشاء حساب جديد" : "تأكيد البريد الإلكتروني"}
      subtitle={
        step === "info"
          ? "انضم إلى Ledger Academy وابدأ رحلتك في إدارة الأعمال."
          : `أدخل الرمز المرسل إلى ${email}`
      }
    >
      {step === "info" ? (
        <AuthFormCard onSubmit={handleSendCode}>
          <AuthError message={error} />

          <div>
            <label className="mb-1.5 block text-sm text-slate-300">الاسم</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-white/15 bg-navy-950 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-gold-400 focus:outline-none"
              placeholder="اسمك الكامل"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-slate-300">البريد الإلكتروني</label>
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
            <label className="mb-1.5 block text-sm text-slate-300">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-lg border border-white/15 bg-navy-950 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-gold-400 focus:outline-none"
              placeholder="8 أحرف على الأقل"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gold-400 py-2.5 font-bold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
          >
            {loading ? "جارٍ الإرسال..." : "إرسال رمز التحقق"}
          </button>

          <p className="text-center text-xs text-slate-400">
            بإنشاء حساب، أنت توافق على{" "}
            <Link href="/terms" className="text-gold-400 underline">
              شروط الاستخدام
            </Link>{" "}
            و
            <Link href="/privacy" className="text-gold-400 underline">
              سياسة الخصوصية
            </Link>
            .
          </p>

          <p className="text-center text-sm text-slate-400">
            لديك حساب بالفعل؟{" "}
            <Link href="/login" className="font-semibold text-gold-400 underline">
              تسجيل الدخول
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
            {loading ? "جارٍ التأكيد..." : "تأكيد وإنشاء الحساب"}
          </button>

          <button
            type="button"
            onClick={() => setStep("info")}
            className="w-full text-center text-sm text-slate-400 hover:text-gold-400"
          >
            تعديل البيانات
          </button>
        </AuthFormCard>
      )}
    </AuthLayout>
  );
}
