"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar } from "@/components/Avatar";

const MAX = 3 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

export function AvatarControl({ url, name }: { url: string | null; name: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    if (!TYPES.includes(file.type)) {
      toast.error("الصيغة غير مدعومة. استخدم صورة JPG أو PNG أو WebP.");
      return;
    }
    if (file.size > MAX) {
      toast.error("حجم الصورة يجب أن يكون أقل من 3 ميجابايت.");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/account/avatar", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "تعذّر رفع الصورة.");
        return;
      }
      toast.success("تم تحديث الصورة.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const res = await fetch("/api/account/avatar", { method: "DELETE" });
      if (res.ok) {
        toast.success("تمت إزالة الصورة.");
        router.refresh();
      } else {
        toast.error("تعذّرت الإزالة.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar name={name} url={url} size="lg" />
      <div className="flex flex-col items-start gap-1">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 transition hover:border-gold-400/40 hover:text-gold-400 disabled:opacity-50"
        >
          {url ? "تغيير الصورة" : "إضافة صورة"}
        </button>
        {url && (
          <button
            type="button"
            disabled={busy}
            onClick={remove}
            className="text-xs text-slate-400 transition hover:text-red-400 disabled:opacity-50"
          >
            إزالة الصورة
          </button>
        )}
      </div>
    </div>
  );
}
