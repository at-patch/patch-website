"use client";

import { createContext, useContext, useMemo, useState } from "react";
import {
  BASE_CURRENCY,
  convertFromBase,
  formatMoney,
  type CurrencySnapshot,
  type SupportedCurrency,
} from "@/lib/currency";

type CurrencyContextValue = CurrencySnapshot & {
  setCurrency: (currency: SupportedCurrency) => Promise<void>;
  convert: (baseAmount: number) => number;
  format: (baseAmount: number) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({
  initialSnapshot,
  children,
}: {
  initialSnapshot: CurrencySnapshot;
  children: React.ReactNode;
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);

  const value = useMemo<CurrencyContextValue>(() => ({
    ...snapshot,
    async setCurrency(currency) {
      const response = await fetch("/api/currency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency }),
      });
      if (!response.ok) throw new Error("Unable to change currency.");
      const payload = (await response.json()) as { data: CurrencySnapshot };
      setSnapshot(payload.data);
    },
    convert(baseAmount) {
      return snapshot.currency === BASE_CURRENCY
        ? baseAmount
        : convertFromBase(baseAmount, snapshot.rate);
    },
    format(baseAmount) {
      const converted =
        snapshot.currency === BASE_CURRENCY
          ? baseAmount
          : convertFromBase(baseAmount, snapshot.rate);
      return formatMoney(converted, snapshot.currency);
    },
  }), [snapshot]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used inside CurrencyProvider.");
  return context;
}

export function Money({ amount, className }: { amount: number; className?: string }) {
  const { format } = useCurrency();
  return <span className={className}>{format(amount)}</span>;
}
