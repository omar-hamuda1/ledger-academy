"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export function AddResourceForm({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState("pdf");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, label, fileUrl, fileType }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("تعذّرت إضافة الملف.");
      return;
    }

    setLabel("");
    setFileUrl("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap items-center gap-2">
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        required
        placeholder="اسم الملف"
        className="min-w-[140px] flex-1 rounded-lg border border-white/15 bg-navy-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-gold-400 focus:outline-none"
      />
      <input
        type="url"
        value={fileUrl}
        onChange={(e) => setFileUrl(e.target.value)}
        required
        placeholder="رابط الملف"
        className="min-w-[160px] flex-1 rounded-lg border border-white/15 bg-navy-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-gold-400 focus:outline-none"
      />
      <select
        value={fileType}
        onChange={(e) => setFileType(e.target.value)}
        className="rounded-lg border border-white/15 bg-navy-950 px-3 py-2 text-sm text-white focus:border-gold-400 focus:outline-none"
      >
        <option value="pdf">PDF</option>
        <option value="xlsx">Excel</option>
        <option value="doc">Word</option>
      </select>
      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg bg-gold-400 px-4 py-2 text-sm font-bold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
      >
        <Plus size={16} />
        إضافة
      </button>
      {error && <p className="w-full text-sm text-red-400">{error}</p>}
    </form>
  );
}
