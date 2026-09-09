"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Pencil, Check, X } from "lucide-react";
import { displayNameError } from "@/lib/validators/name";
import { phoneError } from "@/lib/validators/phone";

// Inline edit for one of the caller's own editable account fields.
export function InlineProfileField({
  field,
  value,
  placeholder,
}: {
  field: "name" | "phone";
  value: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const { update } = useSession();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [busy, setBusy] = useState(false);

  async function save() {
    const err = field === "name" ? displayNameError(draft) : phoneError(draft);
    if (err) {
      toast.error(err);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: draft }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "تعذّر الحفظ.");
        return;
      }
      const saved = data.user[field] as string;
      setDraft(saved);
      if (field === "name") await update({ name: saved });
      toast.success("تم الحفظ.");
      setEditing(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className={field === "name" ? "text-white" : "text-slate-200"} dir={field === "phone" ? "ltr" : undefined}>
          {value || "—"}
        </span>
        <button
          type="button"
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
          className="text-slate-400 transition hover:text-gold-400"
          aria-label={`تعديل ${field === "name" ? "الاسم" : "رقم الهاتف"}`}
        >
          <Pencil size={13} />
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <input
        type={field === "phone" ? "tel" : "text"}
        inputMode={field === "phone" ? "tel" : undefined}
        dir={field === "phone" ? "ltr" : undefined}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        autoFocus
        disabled={busy}
        className="w-48 max-w-full rounded-lg border border-white/15 bg-navy-950 px-2.5 py-1 text-sm text-white focus:border-gold-400 focus:outline-none disabled:opacity-60"
      />
      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="rounded-lg p-1.5 text-emerald-400 transition hover:bg-emerald-400/10 disabled:opacity-50"
        aria-label="حفظ"
      >
        <Check size={15} />
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        disabled={busy}
        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 disabled:opacity-50"
        aria-label="إلغاء"
      >
        <X size={15} />
      </button>
    </span>
  );
}
