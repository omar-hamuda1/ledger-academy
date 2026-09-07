"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldPlus, ShieldMinus, Ban, RotateCcw, KeyRound } from "lucide-react";

type Body =
  | { action: "setRole"; role: "ADMIN" | "STUDENT" }
  | { action: "setDisabled"; disabled: boolean };

export function UserRowActions({
  userId,
  userName,
  role,
  disabled,
}: {
  userId: string;
  userName: string;
  role: "ADMIN" | "STUDENT";
  disabled: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function send(body: Body, confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "تعذّر تنفيذ الإجراء.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    const input = window.prompt(
      `كلمة مرور جديدة لـ «${userName}» (8 أحرف على الأقل)، أو اتركها فارغة لتوليد واحدة تلقائيًا:`,
      "",
    );
    if (input === null) return; // cancelled
    const custom = input.trim();
    if (custom && custom.length < 8) {
      toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(custom ? { action: "setPassword", password: custom } : { action: "setPassword" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "تعذّر إعادة تعيين كلمة المرور.");
        return;
      }
      const pw: string = data.password;
      try {
        await navigator.clipboard.writeText(pw);
      } catch {
        /* clipboard blocked — the alert still shows it */
      }
      window.alert(
        `تم تعيين كلمة مرور جديدة لـ «${userName}»:\n\n${pw}\n\nتم نسخها. أرسلها للمستخدم واطلب منه تغييرها بعد الدخول.`,
      );
    } finally {
      setBusy(false);
    }
  }

  // Icon-only on small screens (labels would blow out the table on a phone),
  // icon + label from sm up.
  const btn =
    "inline-flex items-center gap-1.5 rounded-lg border border-white/15 p-2 text-xs text-slate-300 transition hover:border-gold-400/40 hover:text-gold-400 disabled:opacity-40 sm:px-2.5 sm:py-1.5";
  const label = "hidden sm:inline";

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={resetPassword}
        className={btn}
        title="إعادة تعيين كلمة المرور"
        aria-label="إعادة تعيين كلمة المرور"
      >
        <KeyRound size={13} />
        <span className={label}>إعادة تعيين كلمة المرور</span>
      </button>

      {role === "STUDENT" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => send({ action: "setRole", role: "ADMIN" }, "ترقية هذا المستخدم إلى محاضر؟")}
          className={btn}
          title="ترقية إلى محاضر"
          aria-label="ترقية إلى محاضر"
        >
          <ShieldPlus size={13} />
          <span className={label}>ترقية إلى محاضر</span>
        </button>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => send({ action: "setRole", role: "STUDENT" }, "خفض هذا المحاضر إلى طالب؟")}
          className={btn}
          title="خفض إلى طالب"
          aria-label="خفض إلى طالب"
        >
          <ShieldMinus size={13} />
          <span className={label}>خفض إلى طالب</span>
        </button>
      )}

      {disabled ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => send({ action: "setDisabled", disabled: false })}
          className={btn}
          title="إعادة التفعيل"
          aria-label="إعادة التفعيل"
        >
          <RotateCcw size={13} />
          <span className={label}>إعادة التفعيل</span>
        </button>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            send({ action: "setDisabled", disabled: true }, "تعطيل هذا الحساب؟ لن يتمكن صاحبه من تسجيل الدخول.")
          }
          className={`${btn} hover:border-red-400/40 hover:text-red-400`}
          title="تعطيل الحساب"
          aria-label="تعطيل الحساب"
        >
          <Ban size={13} />
          <span className={label}>تعطيل</span>
        </button>
      )}
    </div>
  );
}
