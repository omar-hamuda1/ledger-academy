"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

export function EditCoursePriceForm({
  courseId,
  initialPrice,
  initialIsPublished,
}: {
  courseId: string;
  initialPrice: number;
  initialIsPublished: boolean;
}) {
  const router = useRouter();
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
      body: JSON.stringify({ price, isPublished }),
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm text-slate-300">
          السعر (ج.م)
          <input
            type="number"
            min={0}
            step={1}
            value={price}
            onChange={(e) => {
              setPrice(Number(e.target.value));
              setSaved(false);
              setError(null);
            }}
            className="w-32 rounded-lg border border-white/15 bg-navy-950 px-3 py-2 text-white focus:border-gold-400 focus:outline-none"
          />
        </label>

        <label className="flex items-center gap-2 pb-2.5 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => {
              setIsPublished(e.target.checked);
              setSaved(false);
              setError(null);
            }}
            className="h-4 w-4 accent-gold-400"
          />
          منشور
        </label>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-gold-400 px-4 py-2 text-sm font-bold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
        >
          <Save size={15} />
          {loading ? "جارٍ الحفظ..." : saved ? "تم الحفظ ✓" : "حفظ"}
        </button>
      </div>
      {error && <p className="max-w-sm text-sm text-red-400">{error}</p>}
    </form>
  );
}
