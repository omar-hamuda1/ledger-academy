"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, Home } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

export default function MarketingError({
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
    <div
      dir="rtl"
      lang="ar"
      className="flex min-h-screen flex-col items-center justify-center gap-5 bg-navy-950 px-6 text-center text-slate-100"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400">
        <RefreshCw size={28} />
      </span>
      <div>
        <h1 className="text-xl font-extrabold text-white">حدث خطأ ما</h1>
        <p className="mt-2 max-w-sm text-sm text-slate-400">
          تعذّر تحميل الصفحة. حاول مرة أخرى أو عُد إلى الصفحة الرئيسية.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-control bg-gold-400 px-5 py-2.5 text-sm font-bold text-navy-950 transition hover:bg-gold-300"
        >
          إعادة المحاولة
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-control border border-white/20 px-5 py-2.5 text-sm font-bold text-white transition hover:border-blue-400 hover:text-blue-300"
        >
          <Home size={16} />
          الرئيسية
        </Link>
      </div>
    </div>
  );
}
