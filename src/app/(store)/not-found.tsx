import Link from "next/link";

export default function StoreNotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-6 py-32 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-patch-ink-muted">404</p>
      <h1 className="font-heading mt-2 text-3xl font-extrabold tracking-tight text-patch-ink">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-3 text-sm text-patch-ink-muted">
        The piece or page you&apos;re looking for may have sold out or moved.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/shop"
          className="rounded-full bg-patch-ink px-6 py-3 text-sm font-medium text-patch-bg hover:opacity-90"
        >
          Browse the shop
        </Link>
        <Link
          href="/"
          className="rounded-full border border-patch-line px-6 py-3 text-sm font-medium text-patch-ink"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
