export default function Loading() {
  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-navy-950 text-slate-100">
      <div className="h-[68px] border-b border-white/10 bg-navy-900/40" />

      <div className="border-b border-white/10 bg-navy-900/40">
        <div className="mx-auto max-w-6xl px-6 py-9">
          <div className="h-4 w-40 animate-pulse rounded bg-white/5" />
          <div className="mt-4 h-9 w-3/4 max-w-xl animate-pulse rounded-lg bg-white/5" />
          <div className="mt-4 h-4 w-full max-w-2xl animate-pulse rounded bg-white/5" />
          <div className="mt-5 flex gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-4 w-24 animate-pulse rounded bg-white/5" />
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          <div className="h-6 w-40 animate-pulse rounded-lg bg-white/5" />
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-card border border-white/10 bg-navy-900/60"
            />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-card border border-white/10 bg-navy-900/60" />
      </div>
    </div>
  );
}
