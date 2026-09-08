"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star } from "lucide-react";

export function RateCourseForm({
  courseId,
  reviewId,
  initialRating,
  initialBody,
}: {
  courseId: string;
  reviewId: string | null;
  initialRating: number;
  initialBody: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState(initialBody);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      toast.error("اختر تقييمًا من ١ إلى ٥ نجوم.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, rating, body: body.trim() || undefined }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error ?? "تعذّر حفظ التقييم.");
      return;
    }
    toast.success(reviewId ? "تم تحديث تقييمك." : "شكرًا لتقييمك!");
    router.refresh();
  }

  async function remove() {
    if (!reviewId || !confirm("حذف تقييمك لهذا الكورس؟")) return;
    setLoading(true);
    const res = await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      toast.error("تعذّر الحذف.");
      return;
    }
    setRating(0);
    setBody("");
    toast.success("تم حذف تقييمك.");
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-card border border-white/10 bg-navy-900/60 p-5 shadow-card"
    >
      <p className="font-bold text-white">
        {reviewId ? "عدّل تقييمك" : "قيّم هذا الكورس"}
      </p>
      <div className="mt-3 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${i} نجوم`}
            className="p-0.5"
          >
            <Star
              size={24}
              className={i <= (hover || rating) ? "text-gold-400" : "text-slate-600"}
              fill={i <= (hover || rating) ? "currentColor" : "none"}
            />
          </button>
        ))}
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, 1000))}
        rows={3}
        placeholder="شاركنا رأيك في الكورس (اختياري)"
        className="mt-3 w-full rounded-lg border border-white/15 bg-navy-950 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-gold-400 focus:outline-none"
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-gold-400 px-5 py-2 text-sm font-bold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
        >
          {loading ? "جارٍ الحفظ..." : reviewId ? "تحديث" : "إرسال"}
        </button>
        {reviewId && (
          <button
            type="button"
            onClick={remove}
            disabled={loading}
            className="text-xs text-slate-400 transition hover:text-red-400"
          >
            حذف تقييمي
          </button>
        )}
      </div>
    </form>
  );
}
