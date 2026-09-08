export default function Loading() {
  return (
    <div className="p-4 pb-24 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="h-7 w-2/3 max-w-md animate-pulse rounded-lg bg-white/5" />
        <div className="mt-5 aspect-video w-full animate-pulse rounded-2xl border border-white/10 bg-navy-900/60" />
        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <div className="h-11 w-44 animate-pulse rounded-control bg-white/5" />
          <div className="h-11 w-40 animate-pulse rounded-control bg-white/5" />
        </div>
        <div className="mt-8 space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-11 animate-pulse rounded-control border border-white/10 bg-navy-900/60"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
