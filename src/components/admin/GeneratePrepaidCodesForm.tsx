"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ticket, Copy, Check } from "lucide-react";
import { formatCode, MAX_BATCH } from "@/lib/prepaid-codes";

export function GeneratePrepaidCodesForm({
  courses,
}: {
  courses: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [quantity, setQuantity] = useState(10);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!courseId) return;
    setLoading(true);
    setGenerated(null);

    const res = await fetch("/api/prepaid-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, quantity }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error ?? "تعذّر إنشاء الأكواد.");
      return;
    }

    setGenerated(data.codes as string[]);
    toast.success(`تم إنشاء ${data.created} كودًا.`);
    router.refresh();
  }

  async function copyAll() {
    if (!generated) return;
    try {
      await navigator.clipboard.writeText(generated.map(formatCode).join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("تعذّر النسخ.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-card border border-white/10 bg-navy-900/60 p-6 shadow-card"
    >
      <div className="flex items-center gap-2 font-bold text-white">
        <Ticket size={18} className="text-gold-400" />
        إنشاء دفعة أكواد
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm text-slate-300">الكورس</label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-navy-950 px-3 py-2.5 text-white focus:border-gold-400 focus:outline-none"
          >
            {courses.length === 0 && <option value="">لا توجد كورسات</option>}
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-slate-300">
            العدد (حتى {MAX_BATCH})
          </label>
          <input
            type="number"
            min={1}
            max={MAX_BATCH}
            value={quantity}
            onChange={(e) =>
              setQuantity(Math.min(MAX_BATCH, Math.max(1, Number(e.target.value) || 1)))
            }
            className="w-full rounded-lg border border-white/15 bg-navy-950 px-3 py-2.5 text-white focus:border-gold-400 focus:outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !courseId}
        className="flex items-center gap-2 rounded-lg bg-gold-400 px-5 py-2.5 font-bold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
      >
        <Ticket size={16} />
        {loading ? "جارٍ الإنشاء..." : "إنشاء الأكواد"}
      </button>

      {generated && generated.length > 0 && (
        <div className="rounded-control border border-gold-400/30 bg-gold-400/5 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-gold-400">
              {generated.length.toLocaleString("ar-EG")} كود جديد — انسخها الآن
            </p>
            <button
              type="button"
              onClick={copyAll}
              className="flex items-center gap-1.5 rounded-control border border-white/15 px-2.5 py-1 text-xs text-slate-200 transition hover:border-gold-400/40 hover:text-gold-400"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "تم النسخ" : "نسخ الكل"}
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto rounded bg-navy-950/60 p-3 font-mono text-xs leading-6 text-slate-200">
            {generated.map((c) => (
              <div key={c}>{formatCode(c)}</div>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
