"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center md:p-8">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400">
        <RefreshCw size={24} />
      </span>
      <div>
        <h1 className="text-lg font-bold text-white">حدث خطأ غير متوقع</h1>
        <p className="mt-1 max-w-sm text-sm text-slate-400">
          تعذّر تحميل هذه الصفحة. حاول مرة أخرى، وإذا تكرر الأمر تواصل مع الدعم.
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="rounded-control bg-gold-400 px-5 py-2.5 text-sm font-bold text-navy-950 transition hover:bg-gold-300"
      >
        إعادة المحاولة
      </button>
    </div>
  );
}
