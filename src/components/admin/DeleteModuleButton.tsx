"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteModuleButton({ moduleId }: { moduleId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("هل أنت متأكد من حذف هذه الوحدة؟ سيتم حذف كل الدروس بداخلها.")) return;
    setLoading(true);
    const res = await fetch(`/api/modules/${moduleId}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      aria-label="حذف الوحدة"
      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-60"
    >
      <Trash2 size={15} />
    </button>
  );
}
