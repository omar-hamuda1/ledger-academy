"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Timer } from "lucide-react";

export function QuizSettingsForm({
  quizId,
  timeLimitSec,
}: {
  quizId: string;
  timeLimitSec: number | null;
}) {
  const router = useRouter();
  const [minutes, setMinutes] = useState(timeLimitSec ? String(Math.round(timeLimitSec / 60)) : "");
  const [loading, setLoading] = useState(false);

  async function save() {
    const trimmed = minutes.trim();
    let next: number | null = null;
    if (trimmed !== "") {
      const m = Number(trimmed);
      if (!Number.isInteger(m) || m < 1 || m > 180) {
        toast.error("المدة يجب أن تكون رقمًا صحيحًا بين 1 و 180 دقيقة، أو فارغة لإلغاء المؤقّت.");
        return;
      }
      next = m * 60;
    }

    setLoading(true);
    const res = await fetch(`/api/quizzes/${quizId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timeLimitSec: next }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "تعذّر حفظ الإعداد.");
      return;
    }
    toast.success(next ? `مؤقّت الاختبار: ${next / 60} دقيقة.` : "تم إلغاء مؤقّت الاختبار.");
    router.refresh();
  }

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-navy-950/40 p-4">
      <p className="flex items-center gap-2 text-sm font-medium text-white">
        <Timer size={15} className="text-gold-400" />
        مؤقّت الاختبار
      </p>
      <p className="mt-1 text-xs text-slate-400">
        عند ضبط مدة، يبدأ العدّ التنازلي فور فتح الطالب للاختبار ويُرسَل تلقائيًا عند
        انتهاء الوقت. اترك الحقل فارغًا لاختبار بلا وقت محدّد.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={180}
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          placeholder="بلا مؤقّت"
          className="w-28 rounded-lg border border-white/15 bg-navy-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-gold-400 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-sm text-slate-400">دقيقة</span>
        <button
          type="button"
          onClick={save}
          disabled={loading}
          className="mr-auto rounded-lg bg-gold-400 px-4 py-2 text-sm font-bold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
        >
          {loading ? "جارٍ الحفظ..." : "حفظ"}
        </button>
      </div>
    </div>
  );
}
