export const SUPPORTED_CURRENCIES = ["BDT", "USD", "EUR", "GBP", "CNY"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const BASE_CURRENCY = "BDT" as const;
export const CURRENCY_COOKIE = "patch_currency";

const EURO_COUNTRIES = new Set([
  "AT", "BE", "HR", "CY", "EE", "FI", "FR", "DE", "GR", "IE",
  "IT", "LV", "LT", "LU", "MT", "NL", "PT", "SK", "SI", "ES",
]);

export interface CurrencySnapshot {
  currency: SupportedCurrency;
  rate: number;
  baseCurrency: typeof BASE_CURRENCY;
  source: "coinbase" | "base-fallback";
  timestamp: string;
}

type CoinbaseResponse = {
  data?: {
    currency?: string;
    rates?: Record<string, string>;
  };
};

let lastKnownGood:
  | { rates: Record<SupportedCurrency, number>; timestamp: string }
  | undefined;

export function isSupportedCurrency(value?: string | null): value is SupportedCurrency {
  return SUPPORTED_CURRENCIES.includes(value as SupportedCurrency);
}

export function currencyForCountry(countryCode?: string | null): SupportedCurrency {
  const country = countryCode?.trim().toUpperCase();
  if (country === "US") return "USD";
  if (country === "GB") return "GBP";
  if (country === "CN") return "CNY";
  if (country && EURO_COUNTRIES.has(country)) return "EUR";
  return "BDT";
}

export function detectCountryFromHeaders(headers: Headers, trustedPlatform = process.env.VERCEL === "1") {
  if (!trustedPlatform) return process.env.DEFAULT_COUNTRY_CODE?.toUpperCase() || "BD";
  return headers.get("x-vercel-ip-country")?.toUpperCase() || "BD";
}

export function convertFromBase(amount: number, rate: number) {
  if (!Number.isFinite(amount) || !Number.isFinite(rate) || rate <= 0) {
    throw new Error("Invalid currency conversion.");
  }
  return Math.round(amount * rate * 100) / 100;
}

export function formatMoney(amount: number, currency: SupportedCurrency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "BDT" ? 0 : 2,
    maximumFractionDigits: currency === "BDT" ? 0 : 2,
  }).format(amount);
}

async function fetchRates(): Promise<{ rates: Record<SupportedCurrency, number>; timestamp: string }> {
  const response = await fetch("https://api.coinbase.com/v2/exchange-rates?currency=BDT", {
    headers: { Accept: "application/json" },
    next: { revalidate: 86_400 },
  });
  if (!response.ok) throw new Error(`Exchange-rate provider returned ${response.status}.`);

  const payload = (await response.json()) as CoinbaseResponse;
  const providerRates = payload.data?.rates;
  if (!providerRates) throw new Error("Exchange-rate provider returned no rates.");

  const rates = Object.fromEntries(
    SUPPORTED_CURRENCIES.map((currency) => {
      const rate = currency === "BDT" ? 1 : Number(providerRates[currency]);
      if (!Number.isFinite(rate) || rate <= 0) {
        throw new Error(`Exchange rate for ${currency} is unavailable.`);
      }
      return [currency, rate];
    })
  ) as Record<SupportedCurrency, number>;

  return { rates, timestamp: new Date().toISOString() };
}

export async function getCurrencySnapshot(
  requestedCurrency: SupportedCurrency
): Promise<CurrencySnapshot> {
  if (requestedCurrency === BASE_CURRENCY) {
    return {
      currency: BASE_CURRENCY,
      rate: 1,
      baseCurrency: BASE_CURRENCY,
      source: "base-fallback",
      timestamp: new Date().toISOString(),
    };
  }

  try {
    lastKnownGood = await fetchRates();
  } catch {
    // A successful cached/warm-instance snapshot is safe to reuse. If no
    // snapshot exists, fall back to canonical BDT rather than guessing.
  }

  const snapshot = lastKnownGood;
  const rate = snapshot?.rates[requestedCurrency];
  if (!rate || !snapshot) {
    return {
      currency: BASE_CURRENCY,
      rate: 1,
      baseCurrency: BASE_CURRENCY,
      source: "base-fallback",
      timestamp: new Date().toISOString(),
    };
  }

  return {
    currency: requestedCurrency,
    rate,
    baseCurrency: BASE_CURRENCY,
    source: "coinbase",
    timestamp: snapshot.timestamp,
  };
}
