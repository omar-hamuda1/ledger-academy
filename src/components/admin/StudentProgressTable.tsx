"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, ArrowUp, ArrowDown, Users } from "lucide-react";
import { Avatar } from "@/components/Avatar";

export type StudentProgressRow = {
  id: string;
  name: string;
  email: string;
  joinedAt: number;
  enrollments: number;
  completedLessons: number;
  quizAttempts: number;
  quizzesPassed: number;
  lastActive: number | null;
};

type SortKey =
  | "name"
  | "enrollments"
  | "completedLessons"
  | "quizzesPassed"
  | "lastActive"
  | "joinedAt";

const PAGE_SIZE = 20;

const COLUMNS: { key: SortKey; label: string; numeric: boolean }[] = [
  { key: "name", label: "الطالب", numeric: false },
  { key: "enrollments", label: "الكورسات", numeric: true },
  { key: "completedLessons", label: "دروس مكتملة", numeric: true },
  { key: "quizzesPassed", label: "اختبارات ناجحة", numeric: true },
  { key: "lastActive", label: "آخر نشاط", numeric: true },
  { key: "joinedAt", label: "تاريخ الانضمام", numeric: true },
];

const dateFmt = new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" });
const relFmt = new Intl.RelativeTimeFormat("ar-EG", { numeric: "auto" });

function relativeDays(ts: number): string {
  const days = Math.round((ts - Date.now()) / (24 * 60 * 60 * 1000));
  if (days <= -30) return dateFmt.format(ts);
  if (days === 0) return "اليوم";
  return relFmt.format(days, "day");
}

export function StudentProgressTable({
  rows,
  capped,
}: {
  rows: StudentProgressRow[];
  capped: boolean;
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("lastActive");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? rows.filter(
          (r) =>
            r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
        )
      : rows;

    const sorted = [...base].sort((a, b) => {
      let av: number | string;
      let bv: number | string;
      if (sortKey === "name") {
        av = a.name.toLowerCase();
        bv = b.name.toLowerCase();
      } else {
        av = a[sortKey] ?? -Infinity;
        bv = b[sortKey] ?? -Infinity;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [rows, query, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
    setPage(1);
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="ابحث بالاسم أو البريد الإلكتروني"
            className="w-full rounded-lg border border-white/15 bg-navy-950 py-2.5 pr-9 pl-3 text-sm text-white focus:border-gold-400 focus:outline-none"
          />
        </div>
        <p className="text-xs text-slate-400">
          {filtered.length.toLocaleString("ar-EG")} طالب
          {capped && " (الحد الأقصى المعروض ٥٠٠)"}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-card border border-white/10 bg-navy-900/60 p-16 text-center shadow-card">
          <Users size={32} className="text-slate-600" />
          <p className="text-slate-400">
            {query ? "لا نتائج مطابقة لبحثك." : "لا يوجد طلاب مسجلون بعد."}
          </p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-card border border-white/10 bg-navy-900/60 shadow-card">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                {COLUMNS.map((col) => {
                  const active = sortKey === col.key;
                  return (
                    <th key={col.key} className="px-4 py-3 font-semibold">
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className={`flex items-center gap-1 transition hover:text-white ${
                          active ? "text-gold-400" : ""
                        } ${col.numeric ? "" : ""}`}
                      >
                        {col.label}
                        {active &&
                          (sortDir === "asc" ? (
                            <ArrowUp size={13} />
                          ) : (
                            <ArrowDown size={13} />
                          ))}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, i) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.3) }}
                  className="border-b border-white/5 text-slate-200 transition-colors last:border-0 hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={row.name} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">{row.name}</p>
                        <p className="truncate text-xs text-slate-400">{row.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{row.enrollments.toLocaleString("ar-EG")}</td>
                  <td className="px-4 py-3">
                    {row.completedLessons.toLocaleString("ar-EG")}
                  </td>
                  <td className="px-4 py-3">
                    {row.quizzesPassed.toLocaleString("ar-EG")}
                    <span className="text-xs text-slate-400">
                      {" "}
                      / {row.quizAttempts.toLocaleString("ar-EG")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {row.lastActive ? relativeDays(row.lastActive) : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {dateFmt.format(row.joinedAt)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/5 disabled:opacity-40"
          >
            السابق
          </button>
          <span className="text-sm text-slate-400">
            {currentPage.toLocaleString("ar-EG")} / {totalPages.toLocaleString("ar-EG")}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/5 disabled:opacity-40"
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
}
