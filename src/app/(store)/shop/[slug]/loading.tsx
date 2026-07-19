export default function ProductLoading() {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:grid-cols-2">
      <div className="aspect-[3/4] animate-pulse bg-patch-bg-alt" />
      <div className="space-y-4">
        <div className="h-5 w-24 animate-pulse rounded-full bg-patch-bg-alt" />
        <div className="h-8 w-3/4 animate-pulse rounded bg-patch-bg-alt" />
        <div className="h-5 w-24 animate-pulse rounded bg-patch-bg-alt" />
        <div className="space-y-2 pt-4">
          <div className="h-4 w-full animate-pulse rounded bg-patch-bg-alt" />
          <div className="h-4 w-full animate-pulse rounded bg-patch-bg-alt" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-patch-bg-alt" />
        </div>
        <div className="h-12 w-full animate-pulse rounded-full bg-patch-bg-alt" />
      </div>
    </div>
  );
}
