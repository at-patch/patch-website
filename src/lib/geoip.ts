import { existsSync } from "node:fs";
import path from "node:path";
import { Reader, type ReaderModel } from "@maxmind/geoip2-node";
import { isTrustedGeoPlatform } from "./currency";

// Server-side country lookup from the visitor's IP — the replacement for
// Cloudflare's cf-ipcountry header, which disappeared when Cloudflare was
// removed from atpatch.shop. Uses a local GeoLite2-Country database file:
// no external API calls, no added latency, visitor IPs never leave the server.
//
// DB path: process.env.GEOIP_DB_PATH, defaulting to
// <app root>/geo/GeoLite2-Country.mmdb. The file is downloaded with a free
// MaxMind license key (see geo/README.md).
//
// Fail-closed: if the DB file is absent or a lookup fails (unknown, private
// or malformed IP), this returns null and callers fall back to the default
// country (BD → BDT), exactly as before.

function geoIpDbPath() {
  return (
    process.env.GEOIP_DB_PATH ||
    path.join(process.cwd(), "geo", "GeoLite2-Country.mmdb")
  );
}

// The reader is opened once and reused; lookups after that are synchronous
// and microseconds-fast. The promise is only cached once the file exists, so
// dropping the DB in later (plus a restart) is enough to enable lookups.
let readerPromise: Promise<ReaderModel | null> | null = null;

function loadReader(): Promise<ReaderModel | null> | null {
  const dbPath = geoIpDbPath();
  if (!existsSync(dbPath)) return null;
  if (!readerPromise) {
    readerPromise = Reader.open(dbPath).catch(() => null);
  }
  return readerPromise;
}

// No proxy/CDN sits in front of the app anymore, so the first x-forwarded-for
// entry (when present) is the visitor; x-real-ip (set by Hostinger's edge) is
// the fallback.
export function clientIpFromHeaders(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  return headers.get("x-real-ip")?.trim() || null;
}

export async function lookupCountryCode(
  ip?: string | null
): Promise<string | null> {
  if (!ip) return null;
  const pending = loadReader();
  if (!pending) return null;
  const reader = await pending;
  if (!reader) return null;
  try {
    return reader.country(ip).country?.isoCode?.toUpperCase() ?? null;
  } catch {
    return null;
  }
}

// Full country detection for request handlers (server-side only — this
// module must never be imported from a client component). Order: trusted
// platform geo headers first (unchanged — see detectCountryFromHeaders in
// currency.ts), then the GeoIP lookup on the visitor's real IP, which is
// what restores detection now that Cloudflare is gone, then the configured
// default (BD → BDT).
export async function detectCountry(headers: Headers): Promise<string> {
  if (isTrustedGeoPlatform(headers.get("x-real-ip"))) {
    const headerCountry =
      headers.get("x-vercel-ip-country") || headers.get("cf-ipcountry");
    if (headerCountry) return headerCountry.toUpperCase();
  }
  const geoCountry = await lookupCountryCode(clientIpFromHeaders(headers));
  if (geoCountry) return geoCountry;
  return process.env.DEFAULT_COUNTRY_CODE?.toUpperCase() || "BD";
}
