"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { AuthLayout, AuthFormCard, AuthError } from "@/components/auth/AuthLayout";
import { PasswordInput } from "@/components/auth/PasswordInput";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setLoading(false);
      // NextAuth returns "CredentialsSignin" for a plain bad-credentials
      // rejection (authorize returned null); anything else is a message our
      // authorize() threw on purpose (rate limit, disabled account) — show it.
      setError(
        result.error === "CredentialsSignin"
          ? "البريد الإلكتروني أو كلمة المرور غير صحيحة."
          : result.error,
      );
      return;
    }

    const session = await getSession();
    const role = (session?.user as { role?: string } | undefined)?.role;

    router.push(role === "ADMIN" ? "/dashboard/admin" : "/dashboard/student");
  }

  return (
    <AuthLayout
      icon={<LogIn size={22} />}
      title="تسجيل الدخول"
      subtitle="سجّل الدخول لمتابعة رحلتك التعليمية في إدارة الأعمال."
    >
      <AuthFormCard onSubmit={handleSubmit}>
        <AuthError message={error} />

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
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-sm text-slate-300">كلمة المرور</label>
            <Link href="/forgot-password" className="text-xs font-semibold text-gold-400 hover:underline">
              نسيت كلمة المرور؟
            </Link>
          </div>
          <PasswordInput
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            ariaLabel="كلمة المرور"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gold-400 py-2.5 font-bold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
        >
          {loading ? "جارٍ الدخول..." : "تسجيل الدخول"}
        </button>

        <p className="text-center text-sm text-slate-400">
          ليس لديك حساب؟{" "}
          <Link href="/register" className="font-semibold text-gold-400 hover:underline">
            إنشاء حساب جديد
          </Link>
        </p>
      </AuthFormCard>
    </AuthLayout>
  );
}
