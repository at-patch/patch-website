# at_patch_web — Codebase Audit & 3-Phase Roadmap

_Last updated: 2026-07-19_

## Overview

Next.js 16 (App Router) storefront + admin dashboard for an apparel/patch brand. Stack: MongoDB/Mongoose, Redux Toolkit + redux-persist (cart), JWT auth via `jose` (separate customer and admin sessions), Cloudinary uploads, bKash/Nagad payment gateways, and an AI chat widget (Vercel AI SDK + Google Vertex).

**Already solid:** product/category/inventory admin CRUD, journal CRUD, cart state management, JWT session plumbing, route protection via [src/proxy.ts](../src/proxy.ts), core storefront pages.

---

## Phase 1 — Revenue-blocking fixes

These block a real launch — checkout currently lies to customers about payment, and two "features" silently do nothing.

1. **✅ DONE (Stripe + COD path) / bKash & Nagad still dormant.**
   Checkout now runs through [src/app/api/payments/stripe/checkout-session/route.ts](../src/app/api/payments/stripe/checkout-session/route.ts) + [src/app/api/payments/stripe/webhook/route.ts](../src/app/api/payments/stripe/webhook/route.ts), with cash-on-delivery as the other real option — `paymentStatus` is now actually transitioned. bKash/Nagad routes are intentionally left as guarded placeholders (`.env.example` now documents them as "dormant for now — Stripe + COD cover Phase 1; revisit later"), so this is a deliberate scope call rather than an oversight.

2. **✅ DONE — Contact messages.**
   Admin inbox page exists at [src/app/admin/(dashboard)/contact/page.tsx](../src/app/admin/(dashboard)/contact/page.tsx), and [src/app/api/contact/route.ts](../src/app/api/contact/route.ts) sends a notification via `sendContactNotification` (Resend) on submit.

3. **✅ DONE — Wishlist.**
   Wired up for real: model, [src/app/api/account/wishlist](../src/app/api/account/wishlist) API routes, and [src/app/(store)/account/wishlist](../src/app/(store)/account/wishlist) page.

4. **✅ DONE — Newsletter signup.**
   No longer a no-op local-state toggle; wired to a real subscriber flow.

5. **✅ DONE — Env var / credentials cleanup.**
   `.env.example` now matches actual `process.env` usage (Mongo, admin/customer auth, Cloudinary, Vertex AI, Stripe, Resend, Upstash rate-limit vars) and explicitly notes bKash/Nagad as dormant rather than silently unused.

6. **✅ DONE — Basic auth hardening.**
   Rate limiting added via [src/lib/rate-limit.ts](../src/lib/rate-limit.ts) (Upstash-backed) on login, register, and contact endpoints. Admin auth is still a single hardcoded email/password pair with no lockout — see Phase 3 item 5 for multi-admin/roles.

---

## Phase 2 — Core UX & commerce completeness

_Status: not started — verified against current code on 2026-07-19._

1. **Order lifecycle gaps.** No refund endpoint despite the `refunded` enum existing on [src/lib/models/Order.ts:41](../src/lib/models/Order.ts:41); no shipping/tracking-number field; no customer-initiated cancel/return action (customer order list is read-only).
2. **Customer account security.** No password reset and no email verification flow anywhere in [src/lib/customer-auth.ts](../src/lib/customer-auth.ts).
3. **Chat widget overpromises.** The system prompt in [src/app/api/chat/route.ts:11-29](../src/app/api/chat/route.ts:11) claims access to "exact stock, order status" and promises lead capture, but `streamText` has no `tools` param — it can't query products/orders, and captured leads go nowhere.
   → Add tool-calling (product/stock/order lookups) plus a real lead-persistence endpoint, or tone down the prompt's claims to match actual capability.
4. **SEO gaps.** Only one static `metadata` export exists, in the root layout. Zero `generateMetadata` on product/journal/shop pages, and zero `error.tsx` / `not-found.tsx` / `loading.tsx` anywhere under `src/app`.
5. **Journal polish.** `coverImage` exists on the `Post` model but both journal pages render an empty placeholder div instead of it ([src/app/(store)/journal/page.tsx:62](../src/app/(store)/journal/page.tsx:62), [src/app/(store)/journal/[slug]/page.tsx:33](../src/app/(store)/journal/[slug]/page.tsx:33)); social-share buttons are dead `href="#"` links.
6. **Discounts.** Cart page literally says "Codes are coming soon" ([src/app/(store)/cart/page.tsx:72](../src/app/(store)/cart/page.tsx:72)) — build a real coupon system if it's part of the launch plan.
7. **Search.** Currently a case-insensitive regex on `name` only ([src/app/api/products/route.ts:16](../src/app/api/products/route.ts:16)) — fine for a small catalog, but add description/SKU matching or a Mongo text index as the catalog grows.

---

## Phase 3 — Scale, quality & ops maturity

_Status: not started — verified against current code on 2026-07-19._

1. **Testing infrastructure is completely absent.** No Vitest/Jest/Playwright, no test files, no `test` script in `package.json`.
   → Start with checkout, auth, and cart — the highest-risk flows.
2. **Validation layer.** `zod` is a dependency but has zero usages in the codebase — API routes rely solely on Mongoose schema validation.
   → Add zod schemas at the API boundary for cleaner, consistent error responses.
3. **Admin analytics.** [src/app/admin/(dashboard)/page.tsx:10](../src/app/admin/(dashboard)/page.tsx:10) only shows 4 raw counts — no revenue figures, trend charts, or top-selling products.
4. **Ops basics.** No `sitemap.xml`/`robots.txt`, no structured data (Product schema.org), no error tracking (e.g. Sentry) or logging strategy.
5. **Admin roles.** Single hardcoded admin account — add real multi-admin/role support if more than one person will manage the store.

---

## Suggested sequencing

Phase 1 is complete (bKash/Nagad deliberately deferred — Stripe + COD cover launch). Phases 2 and 3 remain untouched and can be reprioritized based on which matters more for the business: commerce completeness (Phase 2) vs. long-term maintainability (Phase 3).
