import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";

export function Pagination({
  currentPage,
  totalPages,
  basePath,
  query,
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
  /** Extra query params to preserve across page links (e.g. active filters). */
  query?: Record<string, string | number | undefined>;
}) {
  if (totalPages <= 1) return null;

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const href = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== "") params.set(key, String(value));
    }
    params.set("page", String(page));
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      {hasPrev ? (
        <Link
          href={href(currentPage - 1)}
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
          href={href(currentPage + 1)}
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
