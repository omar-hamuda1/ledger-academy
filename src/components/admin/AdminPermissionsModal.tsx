"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { ADMIN_SCOPES, SCOPE_LABELS, SCOPE_HINTS, type AdminScope } from "@/lib/authz";

// Super-admin only. Checkboxes are framed positively ("can access X"); the API
// stores the *unchecked* ones as `restrictedScopes` (a deny-list).
export function AdminPermissionsModal({
  userId,
  userName,
  restrictedScopes,
  onClose,
}: {
  userId: string;
  userName: string;
  restrictedScopes: string[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [allowed, setAllowed] = useState<Set<AdminScope>>(
    () => new Set(ADMIN_SCOPES.filter((s) => !restrictedScopes.includes(s))),
  );
  const [busy, setBusy] = useState(false);

  function toggle(scope: AdminScope) {
    setAllowed((prev) => {
      const next = new Set(prev);
      if (next.has(scope)) next.delete(scope);
      else next.add(scope);
      return next;
    });
  }

  async function save() {
    setBusy(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "setPermissions",
          restrictedScopes: ADMIN_SCOPES.filter((s) => !allowed.has(s)),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "تعذّر حفظ الصلاحيات.");
        return;
      }
      toast.success(`تم تحديث صلاحيات «${userName}».`);
      router.refresh();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  const restrictedCount = ADMIN_SCOPES.length - allowed.size;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`صلاحيات ${userName}`}
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-card border border-white/10 bg-navy-900 p-6 shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">صلاحيات «{userName}»</h2>
            <p className="mt-1 text-xs text-slate-400">
              اختر الأقسام التي يُسمح لهذا المحاضر باستخدامها. الأقسام غير المحددة
              تُخفى من لوحته وتُرفض من الخادم.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="rounded-lg p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => setAllowed(new Set(ADMIN_SCOPES))}
            className="rounded-lg px-2.5 py-1 font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            تحديد الكل
          </button>
          <button
            type="button"
            onClick={() => setAllowed(new Set())}
            className="rounded-lg px-2.5 py-1 font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            إلغاء الكل
          </button>
        </div>

        <ul className="mt-2 space-y-1">
          {ADMIN_SCOPES.map((scope) => (
            <li key={scope}>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2.5 transition hover:bg-white/[0.03]">
                <input
                  type="checkbox"
                  checked={allowed.has(scope)}
                  onChange={() => toggle(scope)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-gold-400"
                />
                <span>
                  <span className="block text-sm font-medium text-white">
                    {SCOPE_LABELS[scope]}
                  </span>
                  <span className="block text-[11px] text-slate-400">{SCOPE_HINTS[scope]}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400">
            {restrictedCount === 0
              ? "وصول كامل"
              : `${restrictedCount.toLocaleString("ar-EG")} قسم مقيَّد`}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 disabled:opacity-40"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="rounded-lg bg-gold-400 px-4 py-2 text-sm font-bold text-navy-950 transition hover:bg-gold-300 disabled:opacity-40"
            >
              حفظ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
