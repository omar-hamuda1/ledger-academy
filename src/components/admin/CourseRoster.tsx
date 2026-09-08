"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserMinus, Users } from "lucide-react";

export type RosterRow = {
  userId: string;
  name: string;
  email: string;
  enrolledAt: number;
};

const dateFmt = new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" });

export function CourseRoster({
  courseId,
  rows,
}: {
  courseId: string;
  rows: RosterRow[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function remove(row: RosterRow) {
    if (
      !confirm(
        `إزالة ${row.name} من الكورس؟ سيفقد الوصول، وسيُحذف تقدّمه ونتائج اختباراته في هذا الكورس. لا يمكن التراجع.`,
      )
    )
      return;

    setBusyId(row.userId);
    const res = await fetch(`/api/courses/${courseId}/unenroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: row.userId }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);

    if (!res.ok) {
      toast.error(data.error ?? "تعذّرت الإزالة.");
      return;
    }
    toast.success("تمت إزالة الطالب من الكورس.");
    router.refresh();
  }

  return (
    <section className="mt-12">
      <div className="mb-3 flex items-center gap-2">
        <Users size={18} className="text-gold-400" />
        <h2 className="text-lg font-bold text-white">المسجّلون في الكورس</h2>
        <span className="text-sm text-slate-400">({rows.length.toLocaleString("ar-EG")})</span>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-card border border-dashed border-white/15 bg-navy-900/40 p-8 text-center text-sm text-slate-400">
          لا يوجد طلاب مسجّلون في هذا الكورس بعد.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-white/10 bg-navy-900/60 shadow-card">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="px-4 py-3 font-semibold">الطالب</th>
                <th className="px-4 py-3 font-semibold">تاريخ التسجيل</th>
                <th className="px-4 py-3 font-semibold">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.userId}
                  className="border-b border-white/5 text-slate-200 transition-colors last:border-0 hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{row.name}</p>
                    <p className="text-xs text-slate-400">{row.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {dateFmt.format(row.enrolledAt)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={busyId === row.userId}
                      onClick={() => remove(row)}
                      className="flex items-center gap-1 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-500/10 disabled:opacity-60"
                    >
                      <UserMinus size={13} />
                      إزالة
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
