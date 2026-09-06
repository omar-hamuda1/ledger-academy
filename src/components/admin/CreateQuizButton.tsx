"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardPlus } from "lucide-react";

export function CreateQuizButton({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    const res = await fetch("/api/quizzes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId }),
    });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleCreate}
      disabled={loading}
      className="flex items-center gap-2 rounded-lg bg-gold-400 px-4 py-2.5 text-sm font-bold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
    >
      <ClipboardPlus size={16} />
      {loading ? "جارٍ الإنشاء..." : "إنشاء اختبار لهذا الدرس"}
    </button>
  );
}
