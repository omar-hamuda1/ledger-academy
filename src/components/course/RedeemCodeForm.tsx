"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

export function RedeemCodeForm({
  courseId,
  className = "",
}: {
  /** Set on a course page so a code for a different course is rejected up front. */
  courseId?: string;
  className?: string;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/prepaid-codes/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, ...(courseId ? { courseId } : {}) }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "تعذّر تفعيل الكود.");
      return;
    }

    toast.success(`تم تفعيل الكود! لديك الآن وصول كامل إلى «${data.courseTitle}».`);
    setCode("");
    router.refresh();
    if (!courseId && data.courseSlug) {
      router.push(`/courses/${data.courseSlug}`);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-card border border-white/10 bg-navy-900/60 p-5 shadow-card ${className}`}
    >
      <div className="mb-1 flex items-center gap-2 font-bold text-white">
        <KeyRound size={16} className="text-gold-400" />
        أدخل كود الكورس
      </div>
      <p className="mb-3 text-xs text-slate-400">
        إذا حصلت على كود تفعيل مدفوع مسبقًا، أدخله هنا لفتح الكورس بالكامل.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="XXXX-XXXX-XXXX"
          autoComplete="off"
          dir="ltr"
          className="flex-1 rounded-lg border border-white/15 bg-navy-950 px-3 py-2.5 text-center font-mono tracking-wider text-white placeholder:text-slate-600 focus:border-gold-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="rounded-lg bg-gold-400 px-5 py-2.5 font-bold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
        >
          {loading ? "جارٍ التفعيل..." : "تفعيل"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </form>
  );
}
