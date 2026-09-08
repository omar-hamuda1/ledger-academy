"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, FileDown } from "lucide-react";
import { examCsvTemplate } from "@/lib/exam-import";

export function BulkQuestionsUpload({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [replace, setReplace] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rowErrors, setRowErrors] = useState<string[]>([]);

  function downloadTemplate() {
    const blob = new Blob([examCsvTemplate()], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "نموذج-أسئلة-الاختبار.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleFile(file: File) {
    setRowErrors([]);
    if (!/\.csv$/i.test(file.name)) {
      toast.error("الملف يجب أن يكون بصيغة CSV.");
      return;
    }
    setLoading(true);
    try {
      const csv = await file.text();
      const res = await fetch("/api/quizzes/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, csv, mode: replace ? "replace" : "append" }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (Array.isArray(data.rowErrors) && data.rowErrors.length > 0) {
          setRowErrors(data.rowErrors);
          toast.error("الملف يحتوي على أخطاء — راجع القائمة أدناه.");
        } else {
          toast.error(data.error ?? "تعذّر رفع الملف.");
        }
        return;
      }

      toast.success(
        replace
          ? `تم استبدال الأسئلة — ${data.created} سؤالًا الآن.`
          : `تمت إضافة ${data.created} سؤالًا من الملف.`,
      );
      setReplace(false);
      router.refresh();
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-navy-950/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-white">رفع ملف أسئلة (CSV)</p>
        <button
          type="button"
          onClick={downloadTemplate}
          className="flex items-center gap-1.5 text-xs text-gold-400 hover:underline"
        >
          <FileDown size={13} />
          تنزيل نموذج
        </button>
      </div>

      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
        الأعمدة: <span dir="ltr" className="text-slate-300">question, option1…option6, correct</span>.
        عمود <span dir="ltr" className="text-slate-300">correct</span> = رقم الخيار الصحيح (1-6) أو
        حرفه (A-F أو أ-و). صف واحد لكل سؤال، والحد الأقصى 200 سؤال. احفظ الملف بترميز
        UTF-8.
      </p>

      <label className="mt-3 flex items-center gap-2 text-xs text-slate-300">
        <input
          type="checkbox"
          checked={replace}
          onChange={(e) => setReplace(e.target.checked)}
          className="accent-gold-400"
        />
        استبدال كل الأسئلة الحالية بدل الإضافة إليها
      </label>

      <div className="mt-3">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          disabled={loading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-gold-400 file:px-4 file:py-2 file:text-sm file:font-bold file:text-navy-950 hover:file:bg-gold-300 disabled:opacity-60"
        />
      </div>

      {loading && <p className="mt-2 text-xs text-slate-400">جارٍ المعالجة…</p>}

      {rowErrors.length > 0 && (
        <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-red-400">
            <Upload size={13} />
            لم يُستورد أي سؤال. صحّح ما يلي وأعد الرفع:
          </p>
          <ul className="list-disc space-y-0.5 pr-5 text-xs text-red-300">
            {rowErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
