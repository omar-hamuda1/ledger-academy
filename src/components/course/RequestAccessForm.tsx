"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShoppingCart, Clock, ImageUp } from "lucide-react";

const MAX_BYTES = 5 * 1024 * 1024;

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
  const fileRef = useRef<HTMLInputElement>(null);
  const [phone, setPhone] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
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
          سنراجع تحويلك ونفتح لك الكورس في أقرب وقت. ستصلك إشعارًا عند الرد، وتجد
          حالة الطلب في لوحة تحكم الطالب.
        </p>
      </div>
    );
  }

  const refDigits = reference.replace(/[\s-]/g, "");
  const refValid = /^\d{8,20}$/.test(refDigits);
  const canSubmit = !!phone.trim() && refValid && !!fileName && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (loading || !phone.trim() || !refValid || !file) return;

    if (file.size > MAX_BYTES) {
      setError("حجم الصورة يجب أن يكون أقل من 5 ميجابايت.");
      return;
    }

    setLoading(true);
    setError(null);

    // 1) upload the screenshot
    const fd = new FormData();
    fd.append("file", file);
    const up = await fetch("/api/uploads/payment-proof", { method: "POST", body: fd });
    const upData = await up.json().catch(() => ({}));
    if (!up.ok) {
      setLoading(false);
      setError(upData.error ?? "تعذّر رفع الصورة.");
      return;
    }

    // 2) create the request with the returned key
    const res = await fetch("/api/code-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId,
        studentPhone: phone,
        paymentReference: refDigits,
        paymentNote: note.trim() || undefined,
        paymentProofKey: upData.key,
      }),
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
        حوّل قيمة الكورس عبر إنستاباي، ثم أدخل رقم العملية (المرجع) وأرفق صورة
        الإيصال — سنطابق التحويل ونفعّل الكورس.
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
        <div>
          <input
            type="text"
            inputMode="numeric"
            value={reference}
            onChange={(e) => setReference(e.target.value.replace(/[^\d\s-]/g, "").slice(0, 24))}
            placeholder="رقم العملية (المرجع)"
            dir="ltr"
            aria-label="رقم العملية من إنستاباي"
            className="w-full rounded-lg border border-white/15 bg-navy-950 px-3 py-2.5 text-right text-white placeholder:text-slate-600 focus:border-gold-400 focus:outline-none"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            ستجده في إيصال تحويل إنستاباي باسم «المرجع» — أرقام فقط.
          </p>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 500))}
          rows={2}
          placeholder="ملاحظة (اختياري) — مثلاً: حوّلت من حساب ولي الأمر"
          className="w-full rounded-lg border border-white/15 bg-navy-950 px-3 py-2.5 text-white placeholder:text-slate-600 focus:border-gold-400 focus:outline-none"
        />

        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/20 bg-navy-950 px-3 py-2.5 text-sm text-slate-300 transition hover:border-gold-400/40">
          <ImageUp size={16} className="shrink-0 text-gold-400" />
          <span className="truncate">{fileName ?? "أرفق صورة إثبات التحويل"}</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              setFileName(e.target.files?.[0]?.name ?? null);
              setError(null);
            }}
            className="hidden"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-3 rounded-lg bg-gold-400 px-5 py-2.5 font-bold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
      >
        {loading ? "جارٍ الإرسال..." : "إرسال الطلب"}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </form>
  );
}
