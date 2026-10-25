import { afterEach, describe, expect, it } from "vitest";
import { clientIpFromHeaders, detectCountry, lookupCountryCode } from "./geoip";

describe("geoip country lookup", () => {
  const previousDbPath = process.env.GEOIP_DB_PATH;

  afterEach(() => {
    if (previousDbPath === undefined) delete process.env.GEOIP_DB_PATH;
    else process.env.GEOIP_DB_PATH = previousDbPath;
  });

  it("takes the first x-forwarded-for entry as the visitor IP", () => {
    const headers = new Headers({ "x-forwarded-for": " 203.0.113.7 , 10.0.0.1" });
    expect(clientIpFromHeaders(headers)).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip, then null", () => {
    expect(clientIpFromHeaders(new Headers({ "x-real-ip": "198.51.100.3" }))).toBe(
      "198.51.100.3"
    );
    expect(clientIpFromHeaders(new Headers())).toBeNull();
  });

  it("fails closed (null) when the GeoIP database file is absent", async () => {
    process.env.GEOIP_DB_PATH = "/nonexistent/GeoLite2-Country.mmdb";
    await expect(lookupCountryCode("203.0.113.7")).resolves.toBeNull();
  });

  it("returns null for a missing IP", async () => {
    await expect(lookupCountryCode(null)).resolves.toBeNull();
    await expect(lookupCountryCode(undefined)).resolves.toBeNull();
    await expect(lookupCountryCode("")).resolves.toBeNull();
  });

  it("detectCountry falls back to BD with no trusted header and no GeoIP database", async () => {
    process.env.GEOIP_DB_PATH = "/nonexistent/GeoLite2-Country.mmdb";
    await expect(detectCountry(new Headers())).resolves.toBe("BD");
  });
});
