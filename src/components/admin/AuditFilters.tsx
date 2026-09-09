"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

// key → Arabic label. The key is matched server-side as one or more
// `action` prefixes (see AUDIT_CATEGORIES in the page).
export const AUDIT_CATEGORY_LABELS: Record<string, string> = {
  course: "الكورسات",
  lesson: "الدروس",
  module: "الوحدات",
  quiz: "الاختبارات",
  resource: "المرفقات",
  user: "المستخدمون",
  notification: "الإشعارات",
  codes: "الأكواد والطلبات",
  review: "التقييمات",
  qa: "أسئلة وأجوبة الدروس",
  enrollment: "الاشتراكات",
  settings: "الإعدادات العامة",
};

export function AuditFilters({
  q,
  cat,
  from,
  to,
}: {
  q?: string;
  cat?: string;
  from?: string;
  to?: string;
}) {
  const router = useRouter();
  const [term, setTerm] = useState(q ?? "");

  function apply(next: { q?: string; cat?: string; from?: string; to?: string }) {
    const params = new URLSearchParams();
    const qv = "q" in next ? next.q : (q ?? "").trim() || undefined;
    const cv = "cat" in next ? next.cat : cat;
    const fv = "from" in next ? next.from : from;
    const tv = "to" in next ? next.to : to;
    if (qv) params.set("q", qv);
    if (cv) params.set("cat", cv);
    if (fv) params.set("from", fv);
    if (tv) params.set("to", tv);
    const qs = params.toString();
    // page intentionally dropped — a changed filter goes back to page 1
    router.push(`/dashboard/admin/audit${qs ? `?${qs}` : ""}`);
  }

  // Debounce the search box (calls router.push, not setState — lint-safe).
  useEffect(() => {
    const id = setTimeout(() => {
      const trimmed = term.trim();
      if (trimmed !== (q ?? "")) apply({ q: trimmed || undefined });
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  const field =
    "rounded-lg border border-white/15 bg-navy-950 px-3 py-2 text-sm text-white [color-scheme:dark] focus:border-gold-400 focus:outline-none";

  return (
    <div className="mt-6 flex flex-wrap items-end gap-x-4 gap-y-3">
      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="بحث بالبريد أو نوع الإجراء أو المعرّف"
          className="w-72 max-w-full rounded-lg border border-white/15 bg-navy-950 py-2 pr-9 pl-3 text-sm text-white placeholder:text-slate-500 focus:border-gold-400 focus:outline-none"
        />
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-slate-400">النوع</span>
        <select
          value={cat ?? ""}
          onChange={(e) => apply({ cat: e.target.value || undefined })}
          className={field}
        >
          <option value="">كل الأنواع</option>
          {Object.entries(AUDIT_CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-slate-400">من تاريخ</span>
        <input
          type="date"
          value={from ?? ""}
          max={to || undefined}
          onChange={(e) => apply({ from: e.target.value || undefined })}
          className={field}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-slate-400">إلى تاريخ</span>
        <input
          type="date"
          value={to ?? ""}
          min={from || undefined}
          onChange={(e) => apply({ to: e.target.value || undefined })}
          className={field}
        />
      </label>

      {(q || cat || from || to) && (
        <button
          type="button"
          onClick={() => {
            setTerm("");
            router.push("/dashboard/admin/audit");
          }}
          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          مسح الفلاتر
        </button>
      )}
    </div>
  );
}
