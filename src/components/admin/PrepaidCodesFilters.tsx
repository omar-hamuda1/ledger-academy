"use client";

import { useRouter } from "next/navigation";

type Status = "used" | "unused" | undefined;

export function PrepaidCodesFilters({
  courses,
  courseId,
  status,
}: {
  courses: { id: string; title: string }[];
  courseId: string | undefined;
  status: Status;
}) {
  const router = useRouter();

  function apply(next: { courseId?: string; status?: Status }) {
    const params = new URLSearchParams();
    const c = "courseId" in next ? next.courseId : courseId;
    const s = "status" in next ? next.status : status;
    if (c) params.set("courseId", c);
    if (s) params.set("status", s);
    const qs = params.toString();
    router.push(`/dashboard/admin/prepaid-codes${qs ? `?${qs}` : ""}`);
  }

  const statuses: { key: Status; label: string }[] = [
    { key: undefined, label: "الكل" },
    { key: "unused", label: "غير مستخدَم" },
    { key: "used", label: "مستخدَم" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={courseId ?? ""}
        onChange={(e) => apply({ courseId: e.target.value || undefined })}
        className="rounded-lg border border-white/15 bg-navy-950 px-3 py-2 text-sm text-white focus:border-gold-400 focus:outline-none"
      >
        <option value="">كل الكورسات</option>
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </select>

      <div className="flex gap-1">
        {statuses.map((s) => {
          const active = s.key === status;
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => apply({ status: s.key })}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-gold-400/10 text-gold-400"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
