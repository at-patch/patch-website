"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookOpen, Home, Mail, Newspaper, Search, ShoppingBag, Store, User, X } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { AnnouncementBar } from "./AnnouncementBar";

const NAV_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shop", label: "Shop", icon: Store },
  { href: "/story", label: "Our Story", icon: BookOpen },
  { href: "/journal", label: "Journal", icon: Newspaper },
  { href: "/contact", label: "Contact", icon: Mail },
];

export function Header() {
  const cartCount = useAppSelector((state) => state.cart.lines.length);
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
    setQuery("");
  };

  return (
    <div className="sticky top-0 z-40">
      <AnnouncementBar />
      <header className="border-b border-patch-line bg-patch-bg/95 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-3 items-center px-6 py-4">
          <nav className="hidden gap-5 text-sm font-medium text-patch-ink-muted sm:flex">
            {NAV_LINKS.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex whitespace-nowrap items-center gap-1.5 transition-colors hover:text-patch-ink"
              >
                <Icon size={15} strokeWidth={1.8} aria-hidden="true" className="shrink-0" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          <Link
            href="/"
            className="justify-self-center font-heading text-2xl font-extrabold uppercase tracking-tight text-patch-ink"
          >
            PATCH
          </Link>

          <div className="flex items-center justify-end gap-4">
            <button
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search"
              className="text-patch-ink transition-opacity hover:opacity-70"
            >
              {searchOpen ? <X size={19} /> : <Search size={19} />}
            </button>
            <Link href="/account" aria-label="Account" className="text-patch-ink transition-opacity hover:opacity-70">
              <User size={19} />
            </Link>
            <Link href="/cart" aria-label="Cart" className="relative text-patch-ink transition-opacity hover:opacity-70">
              <ShoppingBag size={19} />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-patch-accent-3 text-[10px] font-semibold text-patch-accent-ink">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {searchOpen && (
          <form onSubmit={submitSearch} className="border-t border-patch-line px-6 py-3">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              className="mx-auto block w-full max-w-md bg-transparent text-center text-sm outline-none placeholder:text-patch-ink-muted"
            />
          </form>
        )}

        <nav className="flex justify-center gap-6 border-t border-patch-line py-2 text-xs font-medium text-patch-ink-muted sm:hidden">
          {NAV_LINKS.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 whitespace-nowrap hover:text-patch-ink">
              <Icon size={16} strokeWidth={1.8} aria-hidden="true" className="shrink-0" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </header>
      <div className="flex h-[3px]">
        <span className="flex-1 bg-patch-accent" />
        <span className="flex-1 bg-patch-accent-2" />
        <span className="flex-1 bg-patch-accent-3" />
      </div>
    </div>
  );
}
