export default function Loading() {
  return (
    <div className="p-6 md:p-8">
      <div className="h-7 w-52 animate-pulse rounded-lg bg-white/5" />
      <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded-lg bg-white/5" />

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-card border border-white/10 bg-navy-900/60"
          />
        ))}
      </div>

      <div className="mt-8 overflow-hidden rounded-card border border-white/10 bg-navy-900/60">
        <div className="h-11 border-b border-white/10 bg-white/[0.02]" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 border-b border-white/5 px-4 py-4 last:border-0">
            <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-white/5" />
            <div className="h-4 flex-1 animate-pulse rounded bg-white/5" />
            <div className="hidden h-4 w-24 animate-pulse rounded bg-white/5 sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
