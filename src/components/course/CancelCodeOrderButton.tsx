"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";

export function CancelCodeOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    if (!confirm("إلغاء هذا الطلب؟ يمكنك إرسال طلب جديد في أي وقت.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/code-orders/${orderId}/cancel`, { method: "POST" });
      if (res.ok) {
        toast.success("تم إلغاء الطلب.");
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "تعذّر إلغاء الطلب.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCancel}
      disabled={loading}
      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-slate-400 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
    >
      <X size={12} />
      إلغاء
    </button>
  );
}
