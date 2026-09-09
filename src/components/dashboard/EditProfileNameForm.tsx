"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Pencil, Check, X } from "lucide-react";
import { displayNameError } from "@/lib/validators/name";

export function EditProfileNameForm({ initialName }: { initialName: string }) {
  const router = useRouter();
  const { update } = useSession();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);

  async function save() {
    const err = displayNameError(name);
    if (err) {
      toast.error(err);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "تعذّر حفظ الاسم.");
        return;
      }
      await update({ name: data.user.name }); // refresh the header greeting
      toast.success("تم تحديث الاسم.");
      setName(data.user.name);
      setEditing(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-white">{name}</span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-slate-400 transition hover:text-gold-400"
          aria-label="تعديل الاسم"
        >
          <Pencil size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        disabled={busy}
        className="w-56 max-w-full rounded-lg border border-white/15 bg-navy-950 px-3 py-1.5 text-sm text-white focus:border-gold-400 focus:outline-none disabled:opacity-60"
      />
      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="rounded-lg p-1.5 text-emerald-400 transition hover:bg-emerald-400/10 disabled:opacity-50"
        aria-label="حفظ"
      >
        <Check size={16} />
      </button>
      <button
        type="button"
        onClick={() => {
          setName(initialName);
          setEditing(false);
        }}
        disabled={busy}
        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 disabled:opacity-50"
        aria-label="إلغاء"
      >
        <X size={16} />
      </button>
    </div>
  );
}
