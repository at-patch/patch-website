import { isCloudflareIp } from "./cloudflare-ips";

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

// Vercel injects VERCEL=1 itself, so x-vercel-ip-country can only be set by
// their edge network. Hostinger has no such platform signal, and its shared
// hosting has no firewall/vhost access to restrict the origin to Cloudflare's
// IPs at the network level — so when TRUST_CLOUDFLARE_GEO=1, we additionally
// verify the immediate connecting peer (x-real-ip, set by Hostinger's own
// edge and not client-spoofable) is actually a Cloudflare IP before trusting
// cf-ipcountry. Without that check, anyone hitting the origin directly with a
// forged cf-ipcountry header would bypass Cloudflare entirely.
export function isTrustedGeoPlatform(connectingIp?: string | null) {
  if (process.env.VERCEL === "1") return true;
  if (process.env.TRUST_CLOUDFLARE_GEO === "1") return isCloudflareIp(connectingIp);
  return false;
}

export function detectCountryFromHeaders(
  headers: Headers,
  trustedPlatform = isTrustedGeoPlatform(headers.get("x-real-ip"))
) {
  if (!trustedPlatform) return process.env.DEFAULT_COUNTRY_CODE?.toUpperCase() || "BD";
  const country = headers.get("x-vercel-ip-country") || headers.get("cf-ipcountry");
  return country?.toUpperCase() || "BD";
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
