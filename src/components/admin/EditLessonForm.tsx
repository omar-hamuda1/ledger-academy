"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

export function EditLessonForm({
  lessonId,
  initialTitle,
  initialVideoUrl,
  initialContentHtml,
}: {
  lessonId: string;
  initialTitle: string;
  initialVideoUrl: string;
  initialContentHtml: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl);
  const [contentHtml, setContentHtml] = useState(initialContentHtml);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);

    const res = await fetch(`/api/lessons/${lessonId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, videoUrl, contentHtml }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("تعذّر حفظ التعديلات.");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="animate-slide-up space-y-4 rounded-card border border-white/10 bg-navy-900/60 p-6 shadow-card">
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

      <div>
        <label className="mb-1.5 block text-sm text-slate-300">عنوان الدرس</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full rounded-lg border border-white/15 bg-navy-950 px-3 py-2.5 text-white focus:border-gold-400 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-slate-300">رابط الفيديو</label>
        <input
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          dir="ltr"
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full rounded-lg border border-white/15 bg-navy-950 px-3 py-2.5 text-left text-white placeholder:text-slate-500 focus:border-gold-400 focus:outline-none"
        />
        <p className="mt-1.5 text-xs text-slate-400">
          ارفع الفيديو على يوتيوب كفيديو &quot;غير مُدرج (Unlisted)&quot; حتى لا يظهر في نتائج البحث، ثم الصق رابطه هنا. يعمل أيضًا مع أي رابط فيديو مباشر (.mp4).
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-slate-300">ملاحظات الدرس (نص/HTML)</label>
        <textarea
          value={contentHtml}
          onChange={(e) => setContentHtml(e.target.value)}
          rows={6}
          className="w-full rounded-lg border border-white/15 bg-navy-950 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-gold-400 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-gold-400 px-5 py-2.5 font-bold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
      >
        <Save size={16} />
        {loading ? "جارٍ الحفظ..." : saved ? "تم الحفظ ✓" : "حفظ التعديلات"}
      </button>
    </form>
  );
}
