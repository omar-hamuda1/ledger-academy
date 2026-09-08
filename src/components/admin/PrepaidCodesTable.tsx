"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Check, Ticket, Trash2 } from "lucide-react";
import { formatCode } from "@/lib/prepaid-codes";

export type PrepaidCodeRow = {
  id: string;
  code: string;
  courseTitle: string;
  isUsed: boolean;
  usedByName: string | null;
  usedByEmail: string | null;
  usedAt: number | null;
  createdAt: number;
};

const dateFmt = new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" });

export function PrepaidCodesTable({ rows }: { rows: PrepaidCodeRow[] }) {
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function copy(row: PrepaidCodeRow) {
    try {
      await navigator.clipboard.writeText(formatCode(row.code));
      setCopiedId(row.id);
      setTimeout(() => setCopiedId((id) => (id === row.id ? null : id)), 1500);
    } catch {
      toast.error("تعذّر النسخ.");
    }
  }

  async function remove(row: PrepaidCodeRow) {
    if (!confirm(`حذف الكود ${formatCode(row.code)}؟ لا يمكن التراجع.`)) return;
    setDeletingId(row.id);
    try {
      const res = await fetch(`/api/prepaid-codes/${row.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("تم حذف الكود.");
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "تعذّر حذف الكود.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-white/10 bg-navy-900/60 p-16 text-center shadow-card">
        <Ticket size={32} className="text-slate-600" />
        <p className="text-slate-400">لا توجد أكواد مطابقة.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-card border border-white/10 bg-navy-900/60 shadow-card">
      <table className="w-full text-right text-sm">
        <thead>
          <tr className="border-b border-white/10 text-slate-400">
            <th className="px-4 py-3 font-semibold">الكود</th>
            <th className="px-4 py-3 font-semibold">الكورس</th>
            <th className="px-4 py-3 font-semibold">الحالة</th>
            <th className="px-4 py-3 font-semibold">استخدمه</th>
            <th className="px-4 py-3 font-semibold">تاريخ الإنشاء</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-white/5 text-slate-200 transition-colors last:border-0 hover:bg-white/[0.03]"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <code className="font-mono text-xs tracking-wider text-white">
                    {formatCode(row.code)}
                  </code>
                  <button
                    type="button"
                    onClick={() => copy(row)}
                    aria-label="نسخ الكود"
                    className="text-slate-400 transition hover:text-gold-400"
                  >
                    {copiedId === row.id ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-400">{row.courseTitle}</td>
              <td className="px-4 py-3">
                {row.isUsed ? (
                  <span className="rounded-full bg-slate-500/15 px-2.5 py-1 text-xs font-bold text-slate-300">
                    مستخدَم
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-bold text-emerald-400">
                    متاح
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-slate-400">
                {row.isUsed && row.usedByName ? (
                  <div className="leading-tight">
                    <p className="text-slate-200">{row.usedByName}</p>
                    <p className="text-xs">{row.usedByEmail}</p>
                    {row.usedAt && (
                      <p className="text-xs">{dateFmt.format(row.usedAt)}</p>
                    )}
                  </div>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3 text-slate-400">
                {dateFmt.format(row.createdAt)}
              </td>
              <td className="px-4 py-3">
                {!row.isUsed && (
                  <button
                    type="button"
                    onClick={() => remove(row)}
                    disabled={deletingId === row.id}
                    aria-label="حذف الكود"
                    className="text-slate-400 transition hover:text-red-400 disabled:opacity-40"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
