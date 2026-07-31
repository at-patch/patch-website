import { cookies, headers } from "next/headers";
import { LazyChatWidget } from "@/components/chat/LazyChatWidget";
import { CurrencyProvider } from "@/components/store/CurrencyProvider";
import { Footer } from "@/components/store/Footer";
import { Header } from "@/components/store/Header";
import {
  CURRENCY_COOKIE,
  currencyForCountry,
  detectCountryFromHeaders,
  getCurrencySnapshot,
  isSupportedCurrency,
} from "@/lib/currency";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [requestCookies, requestHeaders] = await Promise.all([cookies(), headers()]);
  const manualCurrency = requestCookies.get(CURRENCY_COOKIE)?.value;
  const requestedCurrency = isSupportedCurrency(manualCurrency)
    ? manualCurrency
    : currencyForCountry(detectCountryFromHeaders(requestHeaders));
  const snapshot = await getCurrencySnapshot(requestedCurrency);

  return (
    <CurrencyProvider initialSnapshot={snapshot}>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <LazyChatWidget />
    </CurrencyProvider>
  );
}
