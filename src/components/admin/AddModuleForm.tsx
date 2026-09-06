"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export function AddModuleForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/modules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, title }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("تعذّرت إضافة الوحدة.");
      return;
    }

    setTitle("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        placeholder="عنوان الوحدة الجديدة"
        className="min-w-[200px] flex-1 rounded-lg border border-white/15 bg-navy-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-gold-400 focus:outline-none"
      />
      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg border border-gold-400/40 px-4 py-2 text-sm font-bold text-gold-400 transition hover:bg-gold-400/10 disabled:opacity-60"
      >
        <Plus size={16} />
        {loading ? "جارٍ الإضافة..." : "إضافة وحدة"}
      </button>
      {error && <p className="w-full text-sm text-red-400">{error}</p>}
    </form>
  );
}
