import { NextRequest, NextResponse } from "next/server";
import {
  CURRENCY_COOKIE,
  currencyForCountry,
  detectCountryFromHeaders,
  getCurrencySnapshot,
  isSupportedCurrency,
} from "@/lib/currency";

export async function GET(request: NextRequest) {
  const countryCode = detectCountryFromHeaders(request.headers);
  const manualCurrency = request.cookies.get(CURRENCY_COOKIE)?.value;
  const currency = isSupportedCurrency(manualCurrency)
    ? manualCurrency
    : currencyForCountry(countryCode);

  return NextResponse.json({
    success: true,
    data: {
      countryCode,
      currency,
      manualOverride: isSupportedCurrency(manualCurrency),
      geoHeaderPresent: request.headers.has("x-vercel-ip-country"),
      platformTrusted: process.env.VERCEL === "1",
    },
  });
}

export async function POST(request: NextRequest) {
  let body: { currency?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body." }, { status: 400 });
  }

  if (!isSupportedCurrency(body.currency)) {
    return NextResponse.json({ success: false, message: "Unsupported currency." }, { status: 400 });
  }

  const snapshot = await getCurrencySnapshot(body.currency);
  const response = NextResponse.json({ success: true, data: snapshot });
  response.cookies.set(CURRENCY_COOKIE, snapshot.currency, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return response;
}
