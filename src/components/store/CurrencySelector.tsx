"use client";

import { useState } from "react";
import { SUPPORTED_CURRENCIES, type SupportedCurrency } from "@/lib/currency";
import { useCurrency } from "@/components/store/CurrencyProvider";

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const [updating, setUpdating] = useState(false);

  return (
    <select
      value={currency}
      disabled={updating}
      aria-label="Currency"
      onChange={async (event) => {
        setUpdating(true);
        try {
          await setCurrency(event.target.value as SupportedCurrency);
        } finally {
          setUpdating(false);
        }
      }}
      className="rounded-lg border border-patch-line bg-transparent px-1.5 py-1 text-[11px] font-semibold text-patch-ink outline-none disabled:opacity-50 sm:px-2 sm:py-1.5 sm:text-xs"
    >
      {SUPPORTED_CURRENCIES.map((code) => (
        <option key={code} value={code} className="bg-patch-bg">
          {code}
        </option>
      ))}
    </select>
  );
}
