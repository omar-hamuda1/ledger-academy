"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { GRADE_OPTIONS } from "@/lib/grades";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function CreateCourseForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [grade, setGrade] = useState(GRADE_OPTIONS[0]);
  const [price, setPrice] = useState(0);
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/[a-z0-9]/.test(slug)) {
      setError("الرابط (slug) يجب أن يحتوي على حروف إنجليزية أو أرقام حقيقية، وليس شرطات فقط.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        slug,
        description,
        grade,
        price,
        isPublished,
      }),
    });
    const data = await res.json().catch(() => ({}));

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "تعذّر إنشاء الكورس.");
      return;
    }

    router.push("/dashboard/admin/courses");
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
          placeholder="مثال: مبادئ إدارة الأعمال"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-slate-300">الرابط (slug) — بحروف إنجليزية</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(slugify(e.target.value))}
          required
          dir="ltr"
          className="w-full rounded-lg border border-white/15 bg-navy-950 px-3 py-2.5 text-left text-white focus:border-gold-400 focus:outline-none"
          placeholder="grade-10-business-administration"
        />
        <p className="mt-1 text-xs text-slate-400">
          اكتب رابطًا بحروف إنجليزية فقط (لا يمكن اشتقاقه تلقائيًا من عنوان عربي). سيظهر كالتالي: /courses/{slug || "..."}
        </p>
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
        نشر الكورس فورًا
      </label>

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-gold-400 px-5 py-2.5 font-bold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
      >
        <PlusCircle size={18} />
        {loading ? "جارٍ الإنشاء..." : "إنشاء الكورس"}
      </button>
    </form>
  );
}
