"use client";

import { Printer } from "lucide-react";

export function PrintInvoiceButton({ label = "Print invoice" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden inline-flex items-center justify-center gap-2 rounded-full bg-patch-ink px-4 py-2.5 text-sm font-medium text-patch-bg transition hover:opacity-90"
    >
      <Printer size={15} />
      {label}
    </button>
  );
}
