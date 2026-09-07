"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export function DeleteQuizButton({ quizId }: { quizId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        "حذف الاختبار بالكامل؟ سيتم حذف كل الأسئلة ومحاولات الطلاب المرتبطة به. لا يمكن التراجع.",
      )
    )
      return;
    setLoading(true);
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("تم حذف الاختبار.");
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "تعذّر حذف الاختبار.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-300 transition hover:border-red-400/40 hover:text-red-400 disabled:opacity-50"
    >
      <Trash2 size={13} />
      حذف الاختبار
    </button>
  );
}
