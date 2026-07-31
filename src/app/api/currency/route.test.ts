import { describe, expect, it, vi } from "vitest";

const { getCurrencySnapshot } = vi.hoisted(() => ({
  getCurrencySnapshot: vi.fn().mockResolvedValue({
    currency: "USD",
    rate: 0.0082,
    baseCurrency: "BDT",
    source: "coinbase",
    timestamp: "2026-07-28T00:00:00.000Z",
  }),
}));

vi.mock("@/lib/currency", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/currency")>();
  return { ...original, getCurrencySnapshot };
});

import { GET, POST } from "./route";

function request(body: unknown) {
  return {
    json: vi.fn().mockResolvedValue(body),
  } as never;
}

describe("currency preference route", () => {
  it("reports trusted geo detection separately from manual override", async () => {
    const previousVercel = process.env.VERCEL;
    process.env.VERCEL = "1";
    try {
      const response = await GET({
        headers: new Headers({ "x-vercel-ip-country": "GB" }),
        cookies: { get: vi.fn().mockReturnValue(undefined) },
      } as never);
      await expect(response.json()).resolves.toMatchObject({
        data: {
          countryCode: "GB",
          currency: "GBP",
          manualOverride: false,
          geoHeaderPresent: true,
          platformTrusted: true,
        },
      });
    } finally {
      process.env.VERCEL = previousVercel;
    }
  });

  it("saves a supported manual currency", async () => {
    const response = await POST(request({ currency: "USD" }));

    expect(response.status).toBe(200);
    expect(getCurrencySnapshot).toHaveBeenCalledWith("USD");
    expect(response.headers.get("set-cookie")).toContain("patch_currency=USD");
  });

  it("rejects unsupported currencies", async () => {
    const response = await POST(request({ currency: "JPY" }));

    expect(response.status).toBe(400);
    expect(getCurrencySnapshot).not.toHaveBeenCalledWith("JPY");
  });
});
