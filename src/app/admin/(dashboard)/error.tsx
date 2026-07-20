"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/admin/ui";
import { logError } from "@/lib/logger";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError("Unhandled error in admin boundary", error, { digest: error.digest });
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-600">
        <AlertTriangle size={20} />
      </div>
      <p className="text-sm font-medium text-patch-ink">Something went wrong</p>
      <p className="max-w-sm text-xs text-patch-ink-muted">
        This screen hit an unexpected error. Try again — if it keeps happening, check the server logs.
      </p>
      <Button onClick={reset} className="mt-2">
        Try again
      </Button>
    </div>
  );
}
