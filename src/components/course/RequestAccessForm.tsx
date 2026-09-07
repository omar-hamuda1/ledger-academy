"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShoppingCart, Clock } from "lucide-react";

export function RequestAccessForm({
  courseId,
  pending,
  paymentInstructions,
}: {
  courseId: string;
  /** True when the student already has a request under review for this course. */
  pending: boolean;
  paymentInstructions: string | null;
}) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(pending);

  if (sent) {
    return (
      <div className="rounded-card border border-white/10 bg-navy-900/60 p-5 shadow-card">
        <div className="flex items-center gap-2 font-bold text-white">
          <Clock size={16} className="text-gold-400" />
          طلبك قيد المراجعة
        </div>
        <p className="mt-1 text-xs text-slate-400">
          سنراجع تحويلك ونفتح لك الكورس في أقرب وقت. ستجد حالة الطلب في لوحة تحكم
          الطالب.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !phone.trim() || note.trim().length < 3) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/code-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, studentPhone: phone, paymentNote: note }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "تعذّر إرسال الطلب.");
      return;
    }

    setSent(true);
    toast.success("تم إرسال طلبك، سنراجعه قريبًا.");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-card border border-white/10 bg-navy-900/60 p-5 shadow-card"
    >
      <div className="mb-1 flex items-center gap-2 font-bold text-white">
        <ShoppingCart size={16} className="text-gold-400" />
        اطلب كودًا للكورس
      </div>
      <p className="mb-3 text-xs text-slate-400">
        حوّل قيمة الكورس ثم أرسل لنا رقمك وبيانات التحويل، وسنفعّل الكورس بعد
        التأكد.
      </p>

      {paymentInstructions && (
        <p className="mb-3 whitespace-pre-line rounded-control border border-gold-400/20 bg-gold-400/5 p-3 text-xs leading-relaxed text-slate-200">
          {paymentInstructions}
        </p>
      )}

      <div className="space-y-2">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="رقم هاتفك (واتساب)"
          dir="ltr"
          className="w-full rounded-lg border border-white/15 bg-navy-950 px-3 py-2.5 text-right text-white placeholder:text-slate-600 focus:border-gold-400 focus:outline-none"
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 500))}
          rows={3}
          placeholder="طريقة الدفع ورقم عملية التحويل (مثال: فودافون كاش، عملية رقم 8842، من رقم 010...)"
          className="w-full rounded-lg border border-white/15 bg-navy-950 px-3 py-2.5 text-white placeholder:text-slate-600 focus:border-gold-400 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !phone.trim() || note.trim().length < 3}
        className="mt-3 rounded-lg bg-gold-400 px-5 py-2.5 font-bold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
      >
        {loading ? "جارٍ الإرسال..." : "إرسال الطلب"}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </form>
  );
}
