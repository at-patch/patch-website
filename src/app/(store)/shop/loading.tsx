export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-10 space-y-3">
        <div className="h-3 w-16 animate-pulse rounded bg-patch-bg-alt" />
        <div className="h-9 w-48 animate-pulse rounded bg-patch-bg-alt" />
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[3/4] animate-pulse bg-patch-bg-alt" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-patch-bg-alt" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-patch-bg-alt" />
          </div>
        ))}
      </div>
    </div>
  );
}
