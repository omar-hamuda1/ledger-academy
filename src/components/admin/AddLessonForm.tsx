"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export function AddLessonForm({ moduleId }: { moduleId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId, title, videoUrl }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("تعذّرت إضافة الدرس.");
      return;
    }

    setTitle("");
    setVideoUrl("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap items-center gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        placeholder="عنوان الدرس الجديد"
        className="min-w-[180px] flex-1 rounded-lg border border-white/15 bg-navy-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-gold-400 focus:outline-none"
      />
      <input
        type="url"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        dir="ltr"
        placeholder="رابط يوتيوب Unlisted (اختياري)"
        className="min-w-[180px] flex-1 rounded-lg border border-white/15 bg-navy-950 px-3 py-2 text-left text-sm text-white placeholder:text-slate-500 focus:border-gold-400 focus:outline-none"
      />
      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg bg-gold-400 px-4 py-2 text-sm font-bold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
      >
        <Plus size={16} />
        {loading ? "جارٍ الإضافة..." : "إضافة"}
      </button>
      {error && <p className="w-full text-sm text-red-400">{error}</p>}
    </form>
  );
}
