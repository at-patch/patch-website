# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`at_patch_web` is a Next.js 16 (App Router) storefront + admin dashboard for Patch, an upcycled-apparel shop. MongoDB/Mongoose is the database, Redux Toolkit + redux-persist manages cart/auth client state, cookie-based JWT sessions handle both customer and admin auth, and it integrates Cloudinary (uploads), Stripe (card checkout), Resend (email), Upstash (rate limiting), and Google Vertex (AI chat assistant).

See `docs/roadmap.md` for the current project state, what's implemented, and open work — it is kept up to date and is the best starting point for "what should I work on." `docs/product-rarity-variants-plan.md` is historical design context for the rarity/variant feature, not an active plan.

## Commands

```bash
pnpm dev              # start dev server (Turbopack)
pnpm build            # production build
pnpm lint             # eslint
pnpm test             # run all tests once (vitest)
pnpm test:watch       # vitest watch mode
pnpm vitest run src/lib/inventory.test.ts   # run a single test file
pnpm vitest run -t "claims stock"           # run tests matching a name
```

CI (`.github/workflows/ci.yml`) runs `pnpm lint`, `pnpm test`, `pnpm build` on PRs/pushes to `main` (Node 24, pnpm 10, frozen lockfile). Run the same three locally before considering a change done; run `pnpm build` for anything release-bound.

Tests live alongside source as `*.test.ts` (vitest config only picks up `src/**/*.test.ts`, node environment, no DOM). There is no separate integration/e2e suite yet — tests are unit-level (auth, cart, coupons, inventory, validation schemas, admin authorization).

## Architecture

**Route groups:** `src/app/(store)/*` is the public storefront (shop, cart, checkout, account, journal, story, contact) sharing `(store)/layout.tsx`. `src/app/admin/*` is the admin dashboard, split into `admin/login` (public) and `admin/(dashboard)/*` (gated). `src/proxy.ts` is the Next middleware: it verifies the admin/customer JWT cookies and redirects unauthenticated `/admin/**` and `/account/**` requests to their respective login pages.

**Auth:** Two independent, non-interchangeable JWT systems:
- Admin: `src/lib/auth.ts` (cookie `patch_admin_session`, secret `ADMIN_JWT_SECRET`). First login bootstraps an "owner" admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD`; after that, admins live in Mongo (`Admin` model) and are managed at `/admin/admins`. `src/lib/require-admin.ts` gates API routes — `requireAdmin` checks any valid session, `requireOwnerAdmin` additionally requires `role === "owner"`. Always gate admin API routes server-side with these; never rely on UI-only gating. Tokens issued before roles existed only carry `email`, so role-gated routes reject them until re-login.
- Customer: `src/lib/customer-auth.ts` (cookie `patch_customer_session`, secret `CUSTOMER_JWT_SECRET`). `src/lib/require-customer.ts` gates customer API routes. Password reset / email verification use one-time tokens: the raw token goes in the emailed link, only its SHA-256 hash is persisted (`generateAccountToken`/`hashAccountToken`).

**Data layer:** `src/lib/db.ts` caches the Mongoose connection across hot reloads/serverless invocations via `global._mongooseCache` — always go through `connectToDatabase()`, never call `mongoose.connect` directly. Models are in `src/lib/models/*` (Product, Order, Customer, Admin, Coupon, InventoryItem, Lead, Post, Category, ContactMessage, Subscriber, HomepageSettings, ProductBatch). Shared TS types mirroring these live in `src/types/*.types.ts`.

**API validation:** `src/lib/validation/*.schemas.ts` holds Zod schemas per domain (auth, order, coupon, admin). `src/lib/validation/index.ts` exports `parseJsonBody(request, schema)`, the standard way every route parses/validates a JSON body and returns a uniform 400 on failure. Use it for any new JSON API boundary rather than parsing manually. The admin order-mutation route uses an explicit field allowlist to prevent mass assignment — follow that pattern for other admin mutation endpoints.

**Product rarity & inventory:** Products are either `one-of-one` (single physical item, no size/color variants, `status: available/reserved/sold`) or `multi-quantity` (has a `variants[]` array of `{size, color, quantity}`). Legacy products without a `rarity` field are treated as `one-of-one`; new admin-created products default to `multi-quantity`. `src/lib/inventory.ts` (`claimStockForItem`/`releaseStockForItem`/`releaseOrderStock`) does atomic stock claim/release via `findOneAndUpdate` — one-of-one flips `status`, multi-quantity does an `$inc` on the matching variant subdocument, matched by `size` + normalized (trimmed) `color`. Cart/order line identity is `product + size + color`; do not change that shape without preserving checkout and stock-compensation behavior. `src/lib/order-claims.ts` builds on this for whole-order claim/release, including rollback when a later item in a multi-item order can't be claimed.

**Payments:** Two live methods only — Cash on Delivery and Stripe Checkout Sessions (`src/lib/stripe.ts`, `src/app/api/payments/stripe/*`). The Stripe webhook is the only source of truth for marking a card order `paid`; COD orders stay `pending` until an admin manually settles them — preserve this truth model. `bkash` and `nagad` routes exist but intentionally return `501` (dormant sandbox integrations, not partially built) — don't wire them into checkout without a full end-to-end implementation.

**Chat assistant:** `src/app/api/chat/route.ts` uses the Vercel AI SDK (`ai`, `@ai-sdk/google-vertex`, `@ai-sdk/react`) with `streamText` + tool calling against Google Vertex. It has tools to query live product/availability data and look up an order (only when both order number and matching checkout email are supplied), and can persist consented leads (`Lead` model, manageable at `/admin/leads`). The system prompt encodes brand voice and the one-of-one vs. limited-batch distinction — keep both in sync if product messaging changes.

**Rate limiting:** `src/lib/rate-limit.ts` wraps Upstash sliding-window limiters, applied to admin login, customer login/register, password reset, verification resend, and contact submission. Currently fail-open (Upstash failure doesn't block the request) — see `docs/roadmap.md` security section before changing this for production.

**Client state:** `src/store/` is a standard Redux Toolkit store (`authSlice`, `cartSlice`, `productSlice`) combined and persisted via `redux-persist` to `localStorage`, whitelisting only `auth` and `cart`. Use the typed hooks in `src/store/hooks.ts` rather than raw `useSelector`/`useDispatch`.

**Errors/logging:** `src/lib/logger.ts` (`logError`) writes structured JSON to `console.error` for server-side failures — it's a minimal foundation, not an external error tracker (no Sentry yet). Use it from API routes rather than ad hoc `console.error`.

**Path aliases:** `@/*` → `src/*`, plus explicit `@/types` and `@/store/*` (see `tsconfig.json`).

## Handoff constraints (from `docs/roadmap.md`, still current)

- Preserve the payment truth model: only Stripe-webhook-confirmed orders are `paid`; COD stays `pending` until manual settlement.
- Treat bKash/Nagad as intentionally dormant.
- Keep inventory and coupon claims atomic and reversible in any checkout/cancellation/payment-failure/refund change.
- Keep variant identity stable as `product + size + color`.
- Use `parseJsonBody` + Zod for new JSON API boundaries, and add focused Vitest coverage with each change.
- Gate admin routes with `requireAdmin`/`requireOwnerAdmin` server-side, not just in the UI.
