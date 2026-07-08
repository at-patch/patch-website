# at_patch_web — Codebase Audit & 3-Phase Roadmap

_Last updated: 2026-07-08_

## Overview

Next.js 16 (App Router) storefront + admin dashboard for an apparel/patch brand. Stack: MongoDB/Mongoose, Redux Toolkit + redux-persist (cart), JWT auth via `jose` (separate customer and admin sessions), Cloudinary uploads, bKash/Nagad payment gateways, and an AI chat widget (Vercel AI SDK + Google Vertex).

**Already solid:** product/category/inventory admin CRUD, journal CRUD, cart state management, JWT session plumbing, route protection via [src/proxy.ts](../src/proxy.ts), core storefront pages.

---

## Phase 1 — Revenue-blocking fixes

These block a real launch — checkout currently lies to customers about payment, and two "features" silently do nothing.

1. **Payments are fake.**
   [src/app/api/payments/bkash/route.ts](../src/app/api/payments/bkash/route.ts:5) and [src/app/api/payments/nagad/route.ts](../src/app/api/payments/nagad/route.ts:5) always return HTTP 501 — no token exchange, no signatures, no callback/webhook handling. Worse, [src/app/(store)/checkout/page.tsx:81](../src/app/(store)/checkout/page.tsx:81) never calls them at all — it creates an order and redirects to success regardless of payment, and nothing in the codebase ever sets `paymentStatus: "paid"`.
   → Build a real bKash/Nagad integration end-to-end (token exchange, checkout redirect, callback verification, order payment-status transition), or explicitly ship cash-on-delivery only and fix the UI/copy so it doesn't imply online payment works.

2. **Contact messages vanish into a void.**
   [src/app/api/contact/route.ts:13](../src/app/api/contact/route.ts:13) just writes to Mongo. No email/Slack notification, and no admin page exists to read submissions at all (despite the model having a `resolved` flag).
   → Add an admin inbox page + a notification on submit (email or Slack webhook).

3. **Wishlist is a lie.**
   [src/components/store/WishlistButton.tsx:8](../src/components/store/WishlistButton.tsx:8) is local `useState` only — no model, no API route, no page. Toggling the heart does nothing beyond a re-render that resets on refresh.
   → Either wire it up properly (model + API + `/account/wishlist` page) or remove the button so it's not a broken promise.

4. **Newsletter signup is a lie.**
   [src/components/store/Footer.tsx:55-58](../src/components/store/Footer.tsx:55) flips local state on submit — the email is never stored or sent anywhere.
   → Wire to a real subscriber store or a 3rd-party (Mailchimp/Klaviyo) or remove the form.

5. **Env var / credentials cleanup.**
   `.env.example` lists `AI_GATEWAY_API_KEY` and full bKash/Nagad var sets that the code never reads, while `GOOGLE_VERTEX_PROJECT` / `GOOGLE_VERTEX_LOCATION` (actually used in [src/app/api/chat/route.ts:5](../src/app/api/chat/route.ts:5)) and GCP credentials are missing from it entirely. `vertex-key.json` at the repo root is currently empty.
   → Reconcile `.env.example` with actual `process.env` usage; confirm real Vertex credentials are provisioned before relying on chat in production.

6. **Basic auth hardening.**
   No rate limiting on login/register/contact endpoints. Admin auth is a single hardcoded email/password pair ([src/app/api/admin/login/route.ts:17](../src/app/api/admin/login/route.ts:17)) with no lockout.
   → Add rate limiting before this is public-facing.

---

## Phase 2 — Core UX & commerce completeness

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

1. **Testing infrastructure is completely absent.** No Vitest/Jest/Playwright, no test files, no `test` script in `package.json`.
   → Start with checkout, auth, and cart — the highest-risk flows.
2. **Validation layer.** `zod` is a dependency but has zero usages in the codebase — API routes rely solely on Mongoose schema validation.
   → Add zod schemas at the API boundary for cleaner, consistent error responses.
3. **Admin analytics.** [src/app/admin/(dashboard)/page.tsx:10](../src/app/admin/(dashboard)/page.tsx:10) only shows 4 raw counts — no revenue figures, trend charts, or top-selling products.
4. **Ops basics.** No `sitemap.xml`/`robots.txt`, no structured data (Product schema.org), no error tracking (e.g. Sentry) or logging strategy.
5. **Admin roles.** Single hardcoded admin account — add real multi-admin/role support if more than one person will manage the store.

---

## Suggested sequencing

Phase 1 is the launch blocker — in particular payments, since checkout currently completes "successfully" with no money changing hands. Phases 2 and 3 can be reprioritized based on which matters more for the business: commerce completeness (Phase 2) vs. long-term maintainability (Phase 3).
