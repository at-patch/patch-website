 # CLAUDE.md

Guidance for Claude Code in this repo.

## Stack

Next.js 16 App Router storefront + admin dashboard (Patch, upcycled apparel). MongoDB/Mongoose, Redux Toolkit + redux-persist (cart/auth), cookie JWT auth (customer + admin, separate), Cloudinary, Stripe Checkout, Resend, Upstash rate limiting, Google Vertex AI chat.

`docs/roadmap.md` = live status/open work, check first. `docs/product-rarity-variants-plan.md` = historical, ignore.

## Commands

pnpm dev / build / lint / test / test:watch

pnpm vitest run src/lib/inventory.test.ts # single file

pnpm vitest run -t "name" # by test name

CI runs lint+test+build on PR/push to main — match locally before done. Tests: `src/**/*.test.ts`, vitest, node env, unit-level only (no e2e).

## Architecture

- Routes: `(store)/*` = public storefront; `admin/(dashboard)/*` = gated admin, `admin/login` public. `src/proxy.ts` middleware checks JWT cookies, redirects unauthed `/admin/**`, `/account/**`.

- Auth (2 separate JWT systems, non-interchangeable):

- Admin — `src/lib/auth.ts`, cookie `patch_admin_session`, secret `ADMIN_JWT_SECRET`. First login bootstraps "owner" from `ADMIN_EMAIL`/`ADMIN_PASSWORD`, then admins live in Mongo (`Admin` model, managed at `/admin/admins`). Gate API routes with `requireAdmin`/`requireOwnerAdmin` (`src/lib/require-admin.ts`) server-side — never UI-only. Pre-roles tokens carry only `email`, rejected by role-gated routes.

- Customer — `src/lib/customer-auth.ts`, cookie `patch_customer_session`, secret `CUSTOMER_JWT_SECRET`, gated via `src/lib/require-customer.ts`. Reset/verify tokens: raw token in email link, only SHA-256 hash stored.

- DB: `src/lib/db.ts` `connectToDatabase()` caches connection via `global._mongooseCache` — always use this, never raw `mongoose.connect`. Models in `src/lib/models/*`, mirrored types in `src/types/*.types.ts`.

- Validation: `src/lib/validation/*.schemas.ts` (Zod) + `parseJsonBody(request, schema)` from `validation/index.ts` — standard body parse/400 for every route. Admin order mutations use an explicit field allowlist (anti mass-assignment) — replicate for new admin mutation routes.

- Rarity/inventory: Product `rarity` is `one-of-one` (no variants, `status: available/reserved/sold`) or `multi-quantity` (`variants[]` of `{size, color, quantity}`). No `rarity` field = legacy = treated as one-of-one; new admin products default multi-quantity. `src/lib/inventory.ts` does atomic claim/release via `findOneAndUpdate` (`$inc` on matched variant for multi-quantity, matched by size + trimmed color; status flip for one-of-one). `src/lib/order-claims.ts` = whole-order claim/release incl. rollback if a later item fails. Cart/order line identity = `product + size + color` — don't change shape without preserving checkout/stock-compensation.

- Payments: only Stripe Checkout (`src/lib/stripe.ts`, `api/payments/stripe/*`) is live. Stripe webhook is sole source of truth for `paid`; COD has been removed from checkout by business decision. `bkash`/`nagad` routes return `501` intentionally (dormant, not partial) — don't wire into checkout without full implementation.

- Chat: `src/app/api/chat/route.ts`, Vercel AI SDK + `@ai-sdk/google-vertex`, `streamText` + tools (live product/availability query, order lookup requiring order number + matching email, consented lead capture → `Lead` model, `/admin/leads`). System prompt encodes brand voice + one-of-one vs limited-batch distinction — keep in sync.

- Rate limiting: `src/lib/rate-limit.ts`, Upstash sliding-window on admin/customer login, register, reset, verify-resend, contact. Currently fail-open.

- State: `src/store/` RTK store (`authSlice`, `cartSlice`, `productSlice`), persisted (`auth`,`cart` only) via redux-persist to localStorage. Use typed hooks in `store/hooks.ts`.

- Logging: `src/lib/logger.ts` `logError()` → structured JSON via `console.error`, no external tracker yet. Use in API routes over ad hoc `console.error`.

- Aliases: `@/*` → `src/*`, plus `@/types`, `@/store/*`.

## Invariants

- Stripe webhook-confirmed = only path to `paid`; COD is no longer a live checkout option.

- bKash/Nagad stay dormant.

- Inventory/coupon claims must stay atomic + reversible.

- Variant identity stays `product + size + color`.

- New JSON routes: `parseJsonBody` + Zod, add Vitest coverage.

- Admin routes: server-side `requireAdmin`/`requireOwnerAdmin`, not UI gating.
