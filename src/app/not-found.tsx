import Link from "next/link";

export default function RootNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-patch-ink-muted">404</p>
      <h1 className="font-heading mt-2 text-3xl font-extrabold tracking-tight text-patch-ink">
        Page not found
      </h1>
      <p className="mt-3 text-sm text-patch-ink-muted">
        We couldn&apos;t find what you were looking for.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-full bg-patch-ink px-6 py-3 text-sm font-medium text-patch-bg hover:opacity-90"
      >
        Back to home
      </Link>
    </div>
  );
}
