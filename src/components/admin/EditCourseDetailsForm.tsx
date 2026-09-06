"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { GRADE_OPTIONS } from "@/lib/grades";

export function EditCourseDetailsForm({
  courseId,
  initialTitle,
  initialDescription,
  initialGrade,
  initialThumbnailUrl,
  initialPrice,
  initialIsPublished,
}: {
  courseId: string;
  initialTitle: string;
  initialDescription: string;
  initialGrade: string | null;
  initialThumbnailUrl: string | null;
  initialPrice: number;
  initialIsPublished: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [grade, setGrade] = useState(initialGrade ?? GRADE_OPTIONS[0]);
  const [thumbnailUrl, setThumbnailUrl] = useState(initialThumbnailUrl ?? "");
  const [price, setPrice] = useState(initialPrice);
  const [isPublished, setIsPublished] = useState(initialIsPublished);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    setError(null);

    const res = await fetch(`/api/courses/${courseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, grade, thumbnailUrl, price, isPublished }),
    });
    const data = await res.json().catch(() => ({}));

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "تعذّر حفظ التعديلات.");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="animate-slide-up space-y-4 rounded-card border border-white/10 bg-navy-900/60 p-6 shadow-card">
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

      <div>
        <label className="mb-1.5 block text-sm text-slate-300">عنوان الكورس</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full rounded-lg border border-white/15 bg-navy-950 px-3 py-2.5 text-white focus:border-gold-400 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-slate-300">الوصف</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
          className="w-full rounded-lg border border-white/15 bg-navy-950 px-3 py-2.5 text-white focus:border-gold-400 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-slate-300">رابط صورة الكورس (اختياري)</label>
        <input
          type="url"
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
          dir="ltr"
          placeholder="https://..."
          className="w-full rounded-lg border border-white/15 bg-navy-950 px-3 py-2.5 text-left text-white placeholder:text-slate-500 focus:border-gold-400 focus:outline-none"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm text-slate-300">الصف الدراسي</label>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-navy-950 px-3 py-2.5 text-white focus:border-gold-400 focus:outline-none"
          >
            {GRADE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-slate-300">السعر (ج.م، 0 = مجاني)</label>
          <input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full rounded-lg border border-white/15 bg-navy-950 px-3 py-2.5 text-white focus:border-gold-400 focus:outline-none"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
          className="h-4 w-4 accent-gold-400"
        />
        الكورس منشور
      </label>

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-gold-400 px-5 py-2.5 font-bold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
      >
        <Save size={18} />
        {loading ? "جارٍ الحفظ..." : saved ? "تم الحفظ ✓" : "حفظ التعديلات"}
      </button>
    </form>
  );
}
