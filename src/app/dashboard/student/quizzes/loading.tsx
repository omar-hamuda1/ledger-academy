export default function Loading() {
  return (
    <div className="p-6 md:p-8">
      <div className="h-7 w-40 animate-pulse rounded-lg bg-white/5" />
      <div className="mt-3 h-4 w-64 animate-pulse rounded-lg bg-white/5" />

      <div className="mt-8 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-card border border-white/10 bg-navy-900/60" />
        ))}
      </div>
    </div>
  );
}
