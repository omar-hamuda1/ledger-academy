"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Award } from "lucide-react";

export function CertificateButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function claim() {
    setLoading(true);
    const res = await fetch("/api/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok || !data.serial) {
      toast.error(data.error ?? "تعذّر إصدار الشهادة.");
      return;
    }
    window.open(`/certificates/${data.serial}`, "_blank", "noopener");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={claim}
      disabled={loading}
      className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-gold-400/40 py-2.5 text-sm font-bold text-gold-400 transition hover:bg-gold-400/10 disabled:opacity-60"
    >
      <Award size={16} />
      {loading ? "جارٍ الإصدار..." : "احصل على شهادتك"}
    </button>
  );
}
