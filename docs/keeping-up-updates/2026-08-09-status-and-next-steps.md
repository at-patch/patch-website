# Status Report — Where We Are & What's Next

_Date: 2026-08-09 • Baseline commit: `00fbc67` (merge of PR #4, `codex/dynamic-plan-tasks-1-9`, last code activity 2026-07-31)_

## TL;DR

The app is **feature-complete for the original launch scope** and about **two-thirds through the dynamic commerce plan (tasks 1–9)**. Everything builds and every test passes. What is blocking real revenue is **not code** — it is **three business inputs** (product weights, shipping rates, staging/Stripe config) plus **four unbuilt features** (best sellers, Buy Now, admin top-10, material tagging).

**The single highest-value next action:** get the client to approve per-product weights (all 14 products currently have none), because that one blocker holds up F0, F2, and the entire checkout E2E verification.

## Verification snapshot (run today on `00fbc67`)

| Check | Result |
|---|---|
| `pnpm lint` | Clean, no warnings |
| `pnpm test` | **130 passed / 130** across 25 test files |
| `pnpm build` | Passes — full route manifest generated |
| CI (`.github/workflows/ci.yml`) | Present; runs lint + test + build on PRs and pushes to `main` |

Note: this worktree needed `pnpm install` before tests would run (`vitest` was missing from `node_modules`). Worth remembering when picking up a fresh worktree.

### Branch hygiene

All feature branches (`codex/dynamic-plan-tasks-1-9`, `claude/dynamic-homepage-sections`, `claude/homepage-bottom-sections-2d2952`, `claude/design-prompt-page-redesign-9fc1cb`, `claude/path-location-33ce9c`, `claude/project-work-list-029278`, `claude/codebase-audit-30068a`) are **fully merged into `main` — zero commits ahead**. There is no unmerged work sitting in a worktree. Old worktrees can be pruned safely.

## Where we are

### Shipped and stable

- **Commerce core:** Stripe-only checkout, signed webhook as sole source of truth for `paid`, atomic inventory claim/release with rollback, coupons with atomic use claims, customer cancellation, admin refunds.
- **Rarity/variants:** `one-of-one` vs `multi-quantity` fully wired through admin, storefront, cart, and inventory. Cart line identity is `product + size + color`.
- **Accounts & admin:** customer auth with reset/verify, admin roles with server-side `requireAdmin`/`requireOwnerAdmin`, multi-admin management, rate limiting (fail-open), Zod validation at every JSON boundary.
- **Storefront:** SEO metadata, robots/sitemap, error/loading/not-found boundaries, journal, chat assistant with live product/order tools and lead capture, editable homepage banners and About/Story copy, hero carousel, product batches.
- **Ops:** shipping cities/costs, internal raw-material and pattern tracking (`INV-####` / `PAT-####`), admin revenue analytics, structured `logError` logging.

### Dynamic plan (tasks 1–9) — actual state

| ID | Deliverable | State | Reality check |
|---|---|---|---|
| F0 | Data contracts, migration, fixtures | **IN REVIEW** | Models/validation/indexes shipped. Migration dry-run passes but **cannot be applied** — 14/14 products have no approved weight. |
| F1 | Geo multi-currency | **IN REVIEW** | BDT/USD/EUR/GBP/CNY live, Vercel geo verified on a real deployment, Coinbase rate service with daily cache + last-known-good, canonical BDT retained on orders. **App-level Checkout/webhook E2E still unrun.** |
| F2 | Country/district weight-based shipping | **IN REVIEW** | Server-authoritative quote API, checkout cutover done, order snapshots done. **Zero `ShippingZone` records exist** — no first/additional-kg rates configured in data. |
| F3 | `/` opens Shop, Home at `/home` | **DONE** | Confirmed in build output: both `/` and `/home` render. |
| F4 | Admin-managed Shop sections | **DONE (2026-08-09)** | Rescoped: sections are curated in admin (name + products), reusing the homepage batch/carousel component, instead of auto-ranked. |
| F5 | Per-product Size Chart | **DONE** | Admin upload + conditional storefront accordion. |
| F6 | Buy Now direct checkout | **DONE (2026-08-09)** | Isolated 30-minute intent; saved cart verified intact through a full Buy Now checkout. |
| F7 | Admin Top 10 Selling | **DONE (2026-08-09)** | `/admin/top-selling` report plus dashboard card, both on the shared `src/lib/best-sellers.ts`. |
| F8 | Admin order/payment filters | **DONE** | URL-synced filters, validation, pagination, route tests. |
| F9 | Raw-material ↔ product tagging + reverse search | **PARTIAL** | `productTags` exists on the `InventoryItem` model and schemas with tests, but **no admin multi-select UI and no reverse-search endpoint**. |
| R1 | Regression + staging acceptance | **BLOCKED** | Gated on F1/F2/F4/F6/F7/F9. |
| 10, 11 | Try-On AI, Pattern sizes | **DEFERRED** | Intentionally out of scope. |

## The real blockers (ranked)

### 1. Product weights — blocks F0, F2, and all checkout E2E

Every one of the 14 products has no valid `weightKg`. The migration defaults to 0.5 kg, which would be an unapproved guess applied to the entire catalog and would then flow into real shipping charges. **This needs a client-supplied weight list, not a technical decision.** Nothing downstream in shipping can be verified until it lands.

### 2. Shipping zone data — blocks F2 sign-off

64/64 legacy Bangladesh locations map cleanly to districts (zero unmapped), and legacy rates are known (Dhaka BDT 80, other 63 districts BDT 120). But there are **zero `ShippingZone` records**, so the new first-kg/additional-kg model has no data behind it. Needs: approved per-district first/additional-kg rates, plus the international country allowlist and per-kg rates (decision D4).

### 3. Staging environment + `STRIPE_WEBHOOK_SECRET` — blocks R1 and launch

Direct Stripe test-mode PaymentIntents already succeeded in all five currencies, but that bypassed the app. The full path — cart → shipping quote → order creation → Stripe session → webhook → `paid` → inventory — has never been run end to end. It needs a designated staging database, a deployed staging URL, and a webhook endpoint with its signing secret.

### 4. Undecided business questions

D4 (international countries + rates), D5 (fractional weight rounding — currently `max(1, ceil(kg))`), and D8 (best-seller definition — currently proposed as units from paid non-refunded orders) all need a yes/no before the dependent code is safe to finalize.

## What to do next

### Immediate — this week

1. **Send the client a weight-and-rates request.** One document: per-product `weightKg` for all 14 products, per-district first-kg/additional-kg rates, and the international country list with rates. Everything shipping-related unblocks the moment this comes back.
2. **Stand up staging.** Separate MongoDB database, deployed environment, Stripe test-mode webhook pointed at `/api/payments/stripe/webhook`, `STRIPE_WEBHOOK_SECRET` set. Use `.env.example` as the full variable checklist.
3. **Turn on branch protection** so the existing CI workflow is actually required for merge. It currently runs but does not gate.

### Next — buildable now, no blockers

~~4. **F4 + F7 together.**~~ — **shipped 2026-08-09.** F4 was rescoped by the client to admin-curated sections; F7 carries the sales ranking that tells admins what to curate.

~~5. **F6 Buy Now.**~~ — **shipped 2026-08-09.**

6. **F9 completion.** The data layer is already there — what's missing is the admin multi-select UI and the product-centric reverse-search endpoint. This is now the only remaining unblocked feature.

### Then — once weights and rates land

7. Apply `pnpm migrate:shipping --apply` against staging, seed the 64 districts and international zones, review the output.
8. Run the full R1 acceptance matrix: five-currency checkout, weight tiers (0.4 / 1 / 2 / 3.5 kg), district vs international routing, coupon checkout, cancellation, refund, duplicate webhook delivery.
9. Retire the legacy city-rate interface once district zones are live in production.

### Ongoing — hardening, not launch-blocking

- Replace fail-open rate limiting with an explicit policy for login/payment endpoints; alert on Upstash failure.
- Add CSRF/origin validation on cookie-authenticated state-changing routes.
- Add real error tracking (Sentry or similar) with PII scrubbing — `logError` is a foundation, not a service.
- Route/integration tests against an isolated Mongo for stock and coupon races and webhook idempotency; browser E2E for the critical paths.
- Replace the placeholder `href="#"` social links in the footer and contact page.

## Decisions needed from you

| # | Question | Recommended default |
|---|---|---|
| 1 | Approved per-product weights | Client-supplied; do not guess |
| 2 | Fractional weight rule | `max(1, ceil(totalWeightKg))` — 3.5 kg bills as 4 kg |
| 3 | International countries + per-kg rates | Admin-managed allowlist, one base rate per country + per-additional-kg |
| 4 | Best-seller definition | Units from paid, non-refunded orders; revenue as tie-breaker |
| 5 | bKash/Nagad — actually required? | Keep dormant unless BD wallet payment is a real business requirement; if yes, ship one provider fully before exposing it |
| 6 | Fate of `docs/product-rarity-variants-plan.md` | Delete after the manual variant flow is verified against real data |

## Invariants to preserve (for whoever picks this up)

- Stripe webhook confirmation is the **only** path to `paid`. COD is removed from live checkout.
- bKash/Nagad routes return `501` **intentionally** — dormant, not half-built.
- Inventory and coupon claims stay atomic and reversible.
- Variant identity stays `product + size + color`.
- Canonical BDT amounts stay on the order alongside converted charged values — historical orders must not move when exchange rates move.
- New JSON routes use `parseJsonBody` + Zod and ship with Vitest coverage.
- Admin routes gate server-side with `requireAdmin`/`requireOwnerAdmin`, never UI-only.
