"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export function DeleteCourseButton({
  courseId,
  courseTitle,
  courseSlug,
  enrollments,
}: {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  enrollments: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    const warning =
      enrollments > 0
        ? `حذف «${courseTitle}» نهائيًا — لا يمكن التراجع. سيُحذف الكورس وكل وحداته ودروسه واختباراته، و${enrollments.toLocaleString(
            "ar-EG",
          )} اشتراك طالب مع تقدّمهم ونتائجهم وشهاداتهم في هذا الكورس.`
        : `حذف «${courseTitle}» نهائيًا — لا يمكن التراجع. سيُحذف الكورس وكل وحداته ودروسه واختباراته.`;

    const typed = window.prompt(`${warning}\n\nللتأكيد اكتب معرّف الكورس (slug):\n${courseSlug}`, "");
    if (typed === null) return; // cancelled
    if (typed.trim() !== courseSlug) {
      toast.error("المعرّف غير مطابق — أُلغِي الحذف.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/courses/${courseId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`تم حذف «${courseTitle}» نهائيًا.`);
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "تعذّر حذف الكورس.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={busy}
      aria-label="حذف الكورس نهائيًا"
      title="حذف الكورس نهائيًا"
      className="text-slate-400 transition hover:text-red-400 disabled:opacity-60"
    >
      <Trash2 size={14} />
    </button>
  );
}
