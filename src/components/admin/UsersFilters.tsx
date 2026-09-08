"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

type RoleFilter = "STUDENT" | "ADMIN" | undefined;
type StatusFilter = "active" | "disabled" | undefined;

export function UsersFilters({
  q,
  role,
  status,
}: {
  q?: string;
  role?: RoleFilter;
  status?: StatusFilter;
}) {
  const router = useRouter();
  const [term, setTerm] = useState(q ?? "");

  function apply(next: { q?: string; role?: RoleFilter; status?: StatusFilter }) {
    const params = new URLSearchParams();
    const qv = "q" in next ? next.q : (q ?? "").trim() || undefined;
    const rv = "role" in next ? next.role : role;
    const sv = "status" in next ? next.status : status;
    if (qv) params.set("q", qv);
    if (rv) params.set("role", rv);
    if (sv) params.set("status", sv);
    const qs = params.toString();
    // page intentionally dropped — a changed filter goes back to page 1
    router.push(`/dashboard/admin/users${qs ? `?${qs}` : ""}`);
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

  const roles: { key: RoleFilter; label: string }[] = [
    { key: undefined, label: "الكل" },
    { key: "STUDENT", label: "طالب" },
    { key: "ADMIN", label: "محاضر" },
  ];
  const statuses: { key: StatusFilter; label: string }[] = [
    { key: undefined, label: "الكل" },
    { key: "active", label: "نشط" },
    { key: "disabled", label: "معطّل" },
  ];

  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="بحث بالاسم أو البريد الإلكتروني"
          className="w-72 max-w-full rounded-lg border border-white/15 bg-navy-950 py-2 pr-9 pl-3 text-sm text-white placeholder:text-slate-500 focus:border-gold-400 focus:outline-none"
        />
      </div>

      <Group label="الدور" items={roles} active={role} onPick={(k) => apply({ role: k })} />
      <Group label="الحالة" items={statuses} active={status} onPick={(k) => apply({ status: k })} />
    </div>
  );
}

function Group<T extends string | undefined>({
  label,
  items,
  active,
  onPick,
}: {
  label: string;
  items: { key: T; label: string }[];
  active: T;
  onPick: (key: T) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-slate-400">{label}</span>
      <div className="flex gap-1">
        {items.map((item) => {
          const isActive = item.key === active;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onPick(item.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                isActive
                  ? "bg-gold-400/10 text-gold-400"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
