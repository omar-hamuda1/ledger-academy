import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";

export function Pagination({
  currentPage,
  totalPages,
  basePath,
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
}) {
  if (totalPages <= 1) return null;

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      {hasPrev ? (
        <Link
          href={`${basePath}?page=${currentPage - 1}`}
          aria-label="الصفحة السابقة"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-slate-300 transition hover:border-gold-400/40 hover:text-gold-400"
        >
          <ChevronRight size={16} />
        </Link>
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/5 text-slate-700">
          <ChevronRight size={16} />
        </span>
      )}

      <span className="text-sm text-slate-400">
        صفحة {currentPage} من {totalPages}
      </span>

      {hasNext ? (
        <Link
          href={`${basePath}?page=${currentPage + 1}`}
          aria-label="الصفحة التالية"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-slate-300 transition hover:border-gold-400/40 hover:text-gold-400"
        >
          <ChevronLeft size={16} />
        </Link>
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/5 text-slate-700">
          <ChevronLeft size={16} />
        </span>
      )}
    </div>
  );
}
