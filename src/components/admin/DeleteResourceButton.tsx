"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteResourceButton({ resourceId }: { resourceId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("هل أنت متأكد من حذف هذا الملف؟")) return;
    setLoading(true);
    const res = await fetch(`/api/resources/${resourceId}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      aria-label="حذف الملف"
      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-60"
    >
      <Trash2 size={14} />
    </button>
  );
}
