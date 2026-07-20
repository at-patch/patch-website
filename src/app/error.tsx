"use client";

import { useEffect } from "react";
import Link from "next/link";
import { logError } from "@/lib/logger";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError("Unhandled error in root boundary", error, { digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center text-patch-ink">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-patch-ink-muted">Error</p>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight">Something went wrong</h1>
      <p className="mt-3 max-w-sm text-sm text-patch-ink-muted">
        An unexpected error occurred. Try again, or head back to the homepage.
      </p>
      <div className="mt-8 flex gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-patch-ink px-6 py-3 text-sm font-medium text-patch-bg hover:opacity-90"
        >
          Try again
        </button>
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
