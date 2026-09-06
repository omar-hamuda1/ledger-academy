"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, ArrowLeft } from "lucide-react";

export function MarkCompleteButton({
  lessonId,
  initialCompleted,
  nextLessonHref,
}: {
  lessonId: string;
  initialCompleted: boolean;
  nextLessonHref: string | null;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);

  async function handleComplete() {
    setLoading(true);
    const res = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, completed: true }),
    });
    setLoading(false);

    if (res.ok) {
      setCompleted(true);
      toast.success("تم إكمال الدرس بنجاح");
      router.refresh();
    } else {
      toast.error("تعذّر حفظ التقدم، حاول مرة أخرى.");
    }
  }

  return (
    <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-white/10 pt-6">
      {completed ? (
        <span className="flex animate-pop items-center gap-2 rounded-lg bg-emerald-500/10 px-5 py-2.5 font-bold text-emerald-400">
          <CheckCircle2 size={18} />
          تم إكمال الدرس
        </span>
      ) : (
        <button
          type="button"
          onClick={handleComplete}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-gold-400 px-5 py-2.5 font-bold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
        >
          <CheckCircle2 size={18} />
          {loading ? "جارٍ الحفظ..." : "تحديد الدرس كمكتمل"}
        </button>
      )}

      {nextLessonHref && (
        <Link
          href={nextLessonHref}
          className="flex items-center gap-2 rounded-lg border border-white/15 px-5 py-2.5 font-bold text-white transition hover:border-gold-400/40 hover:text-gold-400"
        >
          الدرس التالي
          <ArrowLeft size={16} />
        </Link>
      )}
    </div>
  );
}
