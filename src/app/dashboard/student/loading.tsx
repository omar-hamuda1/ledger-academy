export default function Loading() {
  return (
    <div className="p-6 md:p-8">
      <div className="h-7 w-56 animate-pulse rounded-lg bg-white/5" />
      <div className="mt-3 h-4 w-72 animate-pulse rounded-lg bg-white/5" />

      <div className="mt-6 grid grid-cols-3 gap-3 sm:max-w-md">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-control border border-white/10 bg-navy-900/60" />
        ))}
      </div>

      <div className="mt-8 h-5 w-24 animate-pulse rounded-lg bg-white/5" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-card border border-white/10 bg-navy-900/60" />
        ))}
      </div>
    </div>
  );
}
