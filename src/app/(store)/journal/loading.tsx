export default function JournalLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="space-y-3">
        <div className="h-3 w-16 animate-pulse rounded bg-patch-bg-alt" />
        <div className="h-9 w-64 animate-pulse rounded bg-patch-bg-alt" />
      </div>
      <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[4/3] animate-pulse bg-patch-bg-alt" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-patch-bg-alt" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-patch-bg-alt" />
          </div>
        ))}
      </div>
    </div>
  );
}
