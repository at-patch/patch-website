# at_patch_web — Codebase Audit & 3-Phase Roadmap

_Last updated: 2026-07-09_

## Overview

Next.js 16 (App Router) storefront + admin dashboard for an apparel/patch brand. Stack: MongoDB/Mongoose, Redux Toolkit + redux-persist (cart), JWT auth via `jose` (separate customer and admin sessions), Cloudinary uploads, Stripe (card) + Cash on Delivery for payments, and an AI chat widget (Vercel AI SDK + Google Vertex).

**Already solid:** product/category/inventory admin CRUD, journal CRUD, cart state management, JWT session plumbing, route protection via [src/proxy.ts](../src/proxy.ts), core storefront pages, product rarity/variant system with atomic stock claiming, Stripe checkout + webhook lifecycle (with real refunds), wishlist, newsletter signup, contact admin inbox, rate limiting on auth/contact endpoints, shipping/tracking numbers, customer-initiated order cancellation, and password reset + email verification.

**Explicitly out of scope for now:** bKash/Nagad payment gateways. The stub routes were removed rather than left as dead 501s — Stripe + COD cover current needs. Revisit as a scoped project later if local payment methods become a priority.

---

## Phase 1 — Revenue-blocking fixes ✅ done

1. ~~Payments are fake~~ — Stripe Checkout + COD are wired end-to-end (session → webhook → paid/failed → stock release on failure). bKash/Nagad dropped from scope (see above).
2. ~~Contact messages vanish into a void~~ — admin inbox at `/admin/contact` (list + resolve toggle) plus a Resend email notification on submit.
3. ~~Wishlist is a lie~~ — real `Customer.wishlist` field, API routes, `/account/wishlist` page.
4. ~~Newsletter signup is a lie~~ — `Subscriber` model + `/api/subscribers`, Footer form persists for real.
5. ~~Env var / credentials cleanup~~ — `.env.example` reconciled with actual `process.env` usage.
6. ~~Basic auth hardening~~ — Upstash-backed rate limiting on admin login, customer login/register, and contact (fails open if Redis is unreachable).

---

## Phase 2 — Core UX & commerce completeness

1. ~~Order lifecycle gaps~~ — real Stripe refunds (`refundOrder` in [src/lib/stripe.ts](../src/lib/stripe.ts), admin "Refund" button, auto-refund on cancel), `trackingNumber` field with admin input + customer display, customer-initiated cancel at `/account` (restricted to placed/confirmed/processing).
2. ~~Customer account security~~ — password reset (`/account/forgot-password` → `/account/reset-password`, Resend email, Upstash-rate-limited) and email verification at signup (`/account/verify-email`, resend action on the account page).
3. **SEO gaps.** Only one static `metadata` export exists, in the root layout. Zero `generateMetadata` on product/journal/shop pages, and zero `error.tsx` / `not-found.tsx` / `loading.tsx` anywhere under `src/app`.
4. **Journal polish.** `coverImage` exists on the `Post` model but both journal pages render an empty placeholder div instead of it ([src/app/(store)/journal/page.tsx](../src/app/(store)/journal/page.tsx), [src/app/(store)/journal/[slug]/page.tsx](../src/app/(store)/journal/[slug]/page.tsx)); social-share buttons are dead `href="#"` links.
5. **Discounts.** Cart page literally says "Codes are coming soon" ([src/app/(store)/cart/page.tsx](../src/app/(store)/cart/page.tsx)) — build a real coupon system if it's part of the launch plan.
6. **Search.** Currently a case-insensitive regex on `name` only ([src/app/api/products/route.ts](../src/app/api/products/route.ts)) — fine for a small catalog, but add description/SKU matching or a Mongo text index as the catalog grows.

---

## Phase 3 — Scale, quality & ops maturity

1. **Testing infrastructure is completely absent.** No Vitest/Jest/Playwright, no test files, no `test` script in `package.json`.
   → Start with checkout, auth, and cart — the highest-risk flows.
2. **Validation layer.** `zod` is a dependency but has zero usages in the codebase — API routes rely solely on Mongoose schema validation.
   → Add zod schemas at the API boundary for cleaner, consistent error responses.
3. **Admin analytics.** [src/app/admin/(dashboard)/page.tsx](../src/app/admin/(dashboard)/page.tsx) only shows 4 raw counts — no revenue figures, trend charts, or top-selling products.
4. **Ops basics.** No `sitemap.xml`/`robots.txt`, no structured data (Product schema.org), no error tracking (e.g. Sentry) or logging strategy.
5. **Admin roles.** Single hardcoded admin account — add real multi-admin/role support if more than one person will manage the store.

---

## Suggested sequencing

Phase 1 is done. Phase 2 items 1 and 2 (order lifecycle, account security) are done — remaining Phase 2 work (SEO, journal polish, discounts, search) is lower-urgency UX polish. Phase 3 (testing, especially on the stock-claim logic in [src/app/api/orders/route.ts](../src/app/api/orders/route.ts) and the refund logic in [src/lib/stripe.ts](../src/lib/stripe.ts)) is the next highest-risk item, since it protects money-handling code with zero coverage today.
