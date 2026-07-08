"use client";

import Link from "next/link";
import { useState } from "react";
import { FacebookIcon, InstagramIcon } from "@/components/ui/SocialIcons";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer className="border-t border-patch-line bg-patch-bg-alt">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:grid-cols-4">
        <div>
          <p className="font-heading text-xl font-extrabold uppercase tracking-tight text-patch-ink">PATCH</p>
          <p className="mt-3 text-sm text-patch-ink-muted">Dhaka, Bangladesh</p>
          <p className="text-sm text-patch-ink-muted">hello@atpatch.com</p>
          <div className="mt-4 flex gap-3">
            <a href="#" aria-label="Instagram" className="text-patch-ink-muted hover:text-patch-accent">
              <InstagramIcon size={18} />
            </a>
            <a href="#" aria-label="Facebook" className="text-patch-ink-muted hover:text-patch-accent">
              <FacebookIcon size={18} />
            </a>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-patch-ink">Company</p>
          <ul className="mt-4 space-y-2 text-sm text-patch-ink-muted">
            <li><Link href="/story" className="hover:text-patch-accent">Our Story</Link></li>
            <li><Link href="/journal" className="hover:text-patch-accent">Journal</Link></li>
            <li><Link href="/contact" className="hover:text-patch-accent">Contact</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-patch-ink">Shop</p>
          <ul className="mt-4 space-y-2 text-sm text-patch-ink-muted">
            <li><Link href="/shop" className="hover:text-patch-accent">All Pieces</Link></li>
            <li><Link href="/cart" className="hover:text-patch-accent">Cart</Link></li>
            <li><Link href="/account" className="hover:text-patch-accent">Account</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-patch-ink">Stay in the loop</p>
          <p className="mt-4 text-sm text-patch-ink-muted">
            Get notified when new styles drop.
          </p>
          {subscribed ? (
            <p className="mt-3 text-sm font-semibold text-patch-accent">You&apos;re on the list.</p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email.trim()) setSubscribed(true);
              }}
              className="mt-3 flex gap-2"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="min-w-0 flex-1 border-b border-patch-line bg-transparent py-1 text-sm outline-none placeholder:text-patch-ink-muted focus:border-patch-accent"
              />
              <button type="submit" className="text-sm font-semibold text-patch-accent underline underline-offset-4">
                Sign up
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="border-t border-patch-line py-6 text-center text-xs text-patch-ink-muted">
        © {new Date().getFullYear()} Patch. Bold style, made thoughtfully.
      </div>
    </footer>
  );
}
