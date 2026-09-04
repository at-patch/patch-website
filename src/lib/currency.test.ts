import { describe, expect, it } from "vitest";
import {
  convertFromBase,
  currencyForCountry,
  detectCountryFromHeaders,
  formatMoney,
  getCurrencySnapshot,
  isSupportedCurrency,
  isTrustedGeoPlatform,
} from "./currency";

describe("currency selection and conversion", () => {
  it.each([
    ["US", "USD"],
    ["GB", "GBP"],
    ["CN", "CNY"],
    ["DE", "EUR"],
    ["BD", "BDT"],
    ["ZZ", "BDT"],
  ])("maps country %s to %s", (country, expected) => {
    expect(currencyForCountry(country)).toBe(expected);
  });

  it("reads Vercel country only when the platform header is trusted", () => {
    const headers = new Headers({ "x-vercel-ip-country": "US" });
    expect(detectCountryFromHeaders(headers, true)).toBe("US");
    expect(detectCountryFromHeaders(headers, false)).toBe("BD");
  });

  it("reads the Cloudflare country header only when trusted", () => {
    const headers = new Headers({ "cf-ipcountry": "US" });
    expect(detectCountryFromHeaders(headers, true)).toBe("US");
    expect(detectCountryFromHeaders(headers, false)).toBe("BD");
  });

  it("only trusts Cloudflare's header when the connecting peer is actually a Cloudflare IP", () => {
    const previous = process.env.TRUST_CLOUDFLARE_GEO;
    process.env.TRUST_CLOUDFLARE_GEO = "1";
    try {
      // 172.64.0.0/13 is a published Cloudflare range.
      expect(isTrustedGeoPlatform("172.64.1.1")).toBe(true);
      // An arbitrary IP is not — someone hitting the origin directly.
      expect(isTrustedGeoPlatform("1.2.3.4")).toBe(false);
      expect(isTrustedGeoPlatform(null)).toBe(false);
      expect(isTrustedGeoPlatform(undefined)).toBe(false);
    } finally {
      if (previous === undefined) delete process.env.TRUST_CLOUDFLARE_GEO;
      else process.env.TRUST_CLOUDFLARE_GEO = previous;
    }
  });

  it("prefers the Vercel header over Cloudflare's when both are present", () => {
    const headers = new Headers({ "x-vercel-ip-country": "GB", "cf-ipcountry": "US" });
    expect(detectCountryFromHeaders(headers, true)).toBe("GB");
  });

  it("trusts geo headers on Vercel or when Cloudflare trust is explicitly enabled", () => {
    // Assigning undefined to process.env coerces to the string "undefined",
    // so set/unset these explicitly with delete.
    const previous = { VERCEL: process.env.VERCEL, TRUST_CLOUDFLARE_GEO: process.env.TRUST_CLOUDFLARE_GEO };
    const setEnv = (key: keyof typeof previous, value?: string) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    };

    try {
      setEnv("VERCEL");
      setEnv("TRUST_CLOUDFLARE_GEO");
      expect(isTrustedGeoPlatform()).toBe(false);

      setEnv("VERCEL", "1");
      expect(isTrustedGeoPlatform()).toBe(true);

      setEnv("VERCEL");
      setEnv("TRUST_CLOUDFLARE_GEO", "1");
      expect(isTrustedGeoPlatform("172.64.1.1")).toBe(true);
      expect(isTrustedGeoPlatform("1.2.3.4")).toBe(false);
    } finally {
      setEnv("VERCEL", previous.VERCEL);
      setEnv("TRUST_CLOUDFLARE_GEO", previous.TRUST_CLOUDFLARE_GEO);
    }
  });

  it("rounds converted amounts to currency minor units", () => {
    expect(convertFromBase(1000, 0.008123)).toBe(8.12);
  });

  it("formats supported currencies", () => {
    expect(formatMoney(12.5, "USD")).toContain("$12.50");
    expect(formatMoney(1500, "BDT")).toContain("1,500");
  });

  it("rejects unsupported currency codes", () => {
    expect(isSupportedCurrency("USD")).toBe(true);
    expect(isSupportedCurrency("JPY")).toBe(false);
  });

  it("falls back to BDT when no safe rate snapshot exists", async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => new Response(null, { status: 503 });
    try {
      await expect(getCurrencySnapshot("USD")).resolves.toMatchObject({
        currency: "BDT",
        rate: 1,
        source: "base-fallback",
      });
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("loads supported BDT-based rates from Coinbase", async () => {
    const originalFetch = global.fetch;
    global.fetch = async () =>
      Response.json({
        data: {
          currency: "BDT",
          rates: { USD: "0.0082", EUR: "0.0071", GBP: "0.0062", CNY: "0.059" },
        },
      });
    try {
      await expect(getCurrencySnapshot("EUR")).resolves.toMatchObject({
        currency: "EUR",
        rate: 0.0071,
        source: "coinbase",
      });
    } finally {
      global.fetch = originalFetch;
    }
  });
});
