# Dynamic implementation plan - client requirements 1-9

Status: **In progress**
Scope: **Tasks 1-9**
Deferred: **Task 10 (AI Try-on)** and **Task 11 (Pattern sizes)**
Planning baseline: 2026-07-28

## How to use this plan

This is a living delivery plan. Update the status, owner, target date, blockers, and evidence link during each work cycle.

Status values:

- `BACKLOG` - understood but not scheduled
- `READY` - dependencies and acceptance criteria are clear
- `IN PROGRESS` - actively being implemented
- `BLOCKED` - waiting on a recorded decision or dependency
- `IN REVIEW` - implementation complete; verification pending
- `DONE` - acceptance criteria and release checks passed

No task is `DONE` until its API/model work, UI work, automated tests, migration/backfill, and manual acceptance checks are complete.

## Delivery dashboard

| ID | Deliverable | Status | Depends on | Suggested owner | Target | Evidence / notes |
|---|---|---|---|---|---|---|
| F0 | Shared data contracts, migrations, and test fixtures | IN REVIEW | Business decisions D1-D6 | Full stack | Cycle 1 | Dry-run passed; blocked from apply because all 14 products need approved weights |
| F1 | Geo-based multi-currency | IN REVIEW | F0 | Full stack | Cycle 2 | Vercel geo and five Stripe test currencies passed; app Checkout/webhook E2E remains |
| F2 | Country/district and weight-based shipping | IN REVIEW | F0, F1 currency contract | Full stack | Cycles 1-2 | Legacy rates reviewed; new zones and approved product weights are still missing |
| F3 | `/` opens Shop; Home remains separately accessible | DONE | D7 URL choice | Frontend | Cycle 1 | `/` is Shop; editorial Home is `/home`; build verified |
| F4 | Default Top 10 Best Sellers on Shop | READY | F0 sales-query contract | Full stack | Cycle 2 | |
| F5 | Per-product Size Chart accordion/image | DONE | F0 | Full stack | Cycle 1 | Product validation/admin upload/storefront accordion implemented |
| F6 | Buy Now direct checkout | READY | F0 checkout/cart contract | Full stack | Cycle 2 | |
| F7 | Admin Top 10 Selling view | READY | Shared query from F4 | Full stack | Cycle 2 | |
| F8 | Admin order and payment-status filters | DONE | None | Full stack | Cycle 1 | URL filters, validation, pagination, and API tests implemented |
| F9 | Raw-material/product tagging and reverse search | READY | F0 relationship design | Full stack | Cycles 2-3 | |
| R1 | Regression, migration rehearsal, staging acceptance | BACKLOG | F1-F9 | QA + full stack | Cycle 3 | |
| 10 | Virtual Try-On AI estimation/integration | DEFERRED | Separate discovery | Later phase | TBD | Explicitly out of current scope |
| 11 | Exact Pattern size update | DEFERRED | Client's final size list | Later phase | TBD | Keep current Size 1/Size 2 |

## Decisions required before implementation

These decisions do not prevent technical preparation, but production behavior should not be finalized without them.

| ID | Decision | Recommended default |
|---|---|---|
| D1 | Base/catalog currency and rounding | Keep BDT as the canonical stored currency; convert only for display and checkout snapshots. Round using the target currency's minor-unit rules. |
| D2 | Exchange-rate source and refresh policy | Use a server-side rate provider with a daily cached snapshot and last-known-good fallback. Never call a rate provider per product card. |
| D3 | User currency controls | Auto-detect on first visit, then allow a visible manual override stored in a cookie. Manual choice always wins. |
| D4 | International shipping countries and per-kg rates | Admin-managed allowlist. A country has one base rate for the first 1 kg plus a per-additional-kg rate. |
| D5 | Fractional weight rule | Chargeable weight = `max(1, ceil(totalWeightKg))`. Example: 3.5 kg is charged as 4 kg. Confirm if proportional decimals are preferred instead. |
| D6 | Bangladesh location data | Use 64 districts as the pricing unit. Preserve old city records only for migration/compatibility, then remove city dependence from new checkout. |
| D7 | Home URL after Shop becomes `/` | Recommended: Shop at `/`; retain the editorial Home page at `/home` and keep a Home menu item pointing there. |
| D8 | Meaning of “best selling” | Rank by units from paid, non-refunded orders; revenue is secondary. Use a defined tie-breaker (revenue, then newest sale). |
| D9 | Buy Now behavior with an existing cart | Use an isolated checkout intent containing only the selected product/variant; do not silently delete the saved cart. |
| D10 | Product tag relationship | Use product IDs (many-to-many), not free-text names, so renames do not break material traceability. |

## Cycle 1 - foundation and low-risk operational wins

### F0. Shared data contracts and migration groundwork

Status: `IN REVIEW`

Deliverables:

- Add `weightKg` to Product and to each Order item as an immutable checkout snapshot.
- Add optional `sizeChartImage` to Product.
- Add Product references/tags to InventoryItem as a many-to-many relationship.
- Introduce a shipping-zone model that supports:
  - international country zones with no state/district requirement;
  - Bangladesh district zones;
  - first-kg/base rate, additional-kg rate, currency, active status, and audit timestamps.
- Add order snapshots for destination country/district, total physical weight, chargeable weight, applied shipping rule/rate, and displayed/charged currency conversion.
- Add indexes for sales aggregation, order filters, shipping lookup, and inventory-to-product reverse lookup.
- Add validation schemas and mirrored TypeScript types for all new fields.
- Write an idempotent migration/backfill script:
  - existing products receive an explicitly reviewed/default weight;
  - existing shipping-city data is mapped to districts where unambiguous and flagged for review otherwise;
  - existing orders remain historically readable without fabricating weight/rate data;
  - legacy inventory records start with an empty product-tag list.

Acceptance:

- Old records still render after deployment.
- New records cannot bypass server-side validation.
- Migration supports dry-run, produces counts/warnings, and is safe to rerun.
- New indexes and unique constraints are verified against a staging copy.

### F3. Shop as the default landing page

Status: `DONE`

Implementation:

- Move or reuse the current Shop server component at `/`.
- Preserve the current editorial Home experience at the approved URL (recommended `/home`).
- Update Header/Home links, hero links, sitemap, canonical metadata, breadcrumbs, and tests.
- Add a permanent redirect only for obsolete URLs; do not create a `/` <-> `/shop` redirect loop.

Acceptance:

- Opening the bare domain renders the Shop catalog.
- The Home menu item opens the editorial Home page.
- Shop filters, sorting, pagination, metadata, and deep product links continue to work.

### F5. Product Size Chart

Status: `DONE`

Implementation:

- Extend Product model/type/admin validation with `sizeChartImage`.
- Reuse the authenticated Cloudinary upload flow in the product create/edit form.
- Add a “Size Chart” accordion beside Description, Material & Care, and Shipping & Returns.
- Hide the accordion when no chart is assigned, unless the business supplies a global fallback chart.

Acceptance:

- Admin can upload, preview, replace, and remove a chart per product.
- Storefront uses the correct product-specific image with useful alt text and responsive sizing.
- Invalid URLs/file types and oversized uploads fail clearly.

### F8. Order and payment-status filters

Status: `DONE`

Current baseline: the admin orders API accepts `status`; the UI does not expose list filters and the API does not accept `paymentStatus`.

Implementation:

- Validate allowlisted `status` and `paymentStatus` query parameters server-side.
- Combine filters with AND semantics and add an “All” option for each.
- Add dropdowns above the orders table; synchronize values to the URL so filtered views can be bookmarked/shared.
- Add loading, empty-filter-result, reset, and request-error states.
- Add pagination/query limits if the order list is still unbounded.

Acceptance:

- Selecting Payment = Pending shows only pending-payment orders in one action.
- Status and payment filters work independently and together.
- Invalid query values return a controlled 400 response.
- API tests cover each filter and their combined behavior.

## Cycle 2 - pricing, shipping, sales ranking, and direct checkout

### F1. Geo-based multi-currency

Status: `IN REVIEW`

Implementation:

- Detect country at the server/edge boundary using the deployment platform's trusted geo headers; do not trust a client-supplied country header.
- Map supported countries/regions to currency (at minimum USD, EUR, GBP, CNY, and BDT fallback).
- Build one shared money service for conversion, rounding, formatting, and rate-version metadata.
- Cache exchange rates and retain a last-known-good rate; degrade to BDT if no safe rate exists.
- Add a currency selector and persist manual override in a cookie.
- Apply currency consistently to catalog cards, product detail, cart, coupons/discount presentation, shipping, checkout, Stripe line items, receipts, and order snapshots.
- Continue storing canonical BDT amounts alongside conversion rate/currency snapshots so financial history does not change when rates change.
- Update product JSON-LD currency/price for the rendered currency or keep canonical metadata consistently documented.

Acceptance:

- Geo test fixtures show USD, EUR, GBP, CNY, and BDT as expected.
- A user's manual selection survives navigation and overrides geo-detection.
- Product subtotal + discount + shipping = checkout total in the same currency and minor units.
- A rate-provider outage does not break browsing or produce mixed-currency carts.
- Server recalculates all monetary values; client totals are never trusted.

### F2. Dynamic country/district and weight-based shipping

Status: `IN REVIEW`

Implementation:

- Replace the current city-only setup with a country-first admin hierarchy:
  - collapsed/searchable country list;
  - Bangladesh expands to 64 searchable districts;
  - international countries expose one country-wide rule;
  - edit active status and first/additional kg rates without a cluttered flat list.
- Require product weight in admin create/edit and show a clear unit (`kg`).
- In cart/checkout calculate:
  - `totalWeightKg = sum(productWeightKg x itemQuantity)`;
  - `chargeableWeightKg = max(1, roundingRule(totalWeightKg))`;
  - shipping from the destination's active rule.
- Calculate shipping only on the server during order creation, then snapshot the result on the order.
- Show total physical weight, chargeable weight, rate rule, and shipping charge in cart/checkout.
- Include the converted shipping amount in Stripe using the exact same money service as F1.
- Reject checkout for inactive/unsupported destinations or products missing valid weight.

Acceptance:

- A cart below 1 kg receives the 1 kg minimum charge.
- Test cases cover exactly 1 kg, 2 kg, 3.5 kg, multiple quantities/variants, and unsupported destinations.
- Any Bangladesh district uses its configured district rate.
- Any address within an enabled international country uses that country's flat geographic rule.
- Admin search finds countries/districts and updates persist.
- Order, Stripe session, success page, invoice, and admin view agree on weight and shipping total.

### F4 + F7. Shared best-seller ranking for Shop and Admin

Status: `READY`

Build one server-side aggregation service and reuse it in both places to avoid conflicting rankings.

Implementation:

- Aggregate paid, non-refunded order items by stable Product ID.
- Rank by units sold, then revenue, then the approved deterministic tie-breaker.
- Return live product data plus sales count/revenue; preserve historical names for deleted products in admin reporting.
- Add/verify supporting Order indexes and set a cache/revalidation policy.
- Shop behavior:
  - with no search/filter/sort selection, show a clearly labeled Top 10 Best Sellers section first;
  - when any supported sort/filter is selected, show the complete filtered catalog in Newest/High-to-Low/Low-to-High order;
  - define a sensible fallback (for example Newest) when fewer than 10 products have sales.
- Admin behavior:
  - change the current aggregation limit from 5 to 10;
  - display both units and revenue, with clear ranking basis.

Acceptance:

- Shop and admin return the same ranked products for the same paid-order dataset.
- Pending, failed, cancelled-unpaid, and refunded transactions do not inflate sales.
- Default Shop view is Top 10; selecting any sort switches to that sort predictably.
- Tests cover ties, deleted/archived products, no-sales fallback, and multi-quantity products.

### F6. Buy Now direct checkout

Status: `READY`

Implementation:

- Add Buy Now beside Add to Cart on the product page and variant picker.
- Require a valid in-stock size/color selection for multi-quantity products.
- Create a short-lived, server-validated checkout intent for exactly the selected item; never accept client price, currency, weight, or availability.
- Navigate directly to Checkout and preselect that intent without clearing the persisted normal cart.
- Reuse existing order claim/rollback, coupon policy, shipping calculation, Stripe session creation, and failure recovery.
- Prevent double submission and show sold/reserved/out-of-stock errors cleanly.
- Decide whether the sticky mobile bar also exposes Buy Now.

Acceptance:

- One-of-one and variant products go directly to Checkout with the correct selection.
- Existing cart remains intact after completing/cancelling an isolated Buy Now flow.
- Refresh/back navigation has defined behavior; expired intents fail safely.
- Stock contention cannot oversell, and a failed Stripe setup releases reservations.

## Cycle 3 - raw-material traceability and release

### F9. Raw-material/Product tagging and search

Status: `READY`

Implementation:

- Add a searchable multi-select Product Tag field to raw-material create/edit.
- Store stable Product ObjectIds on InventoryItem; populate only the minimal fields needed by admin UI.
- Add a product-centric search endpoint/view that returns every linked raw material, including fabric code, category, dimensions, quantity, image, and inventory code.
- Support partial name/SKU search with escaped input, result limits, pagination, and indexes.
- Decide deletion behavior: recommended soft/archive products or preserve dangling historical labels rather than erasing traceability.
- Keep `Product.sourceInventoryItem` compatible during migration, but move toward a single documented many-to-many source of truth to prevent two relationships drifting.

Acceptance:

- Admin can tag one material to multiple products and one product to multiple materials.
- Searching by product name or SKU returns the complete linked raw-material list.
- Product renaming does not break links.
- Removing a tag updates reverse-search results without deleting either record.
- Authorization, validation, empty states, and query tests are present.

## Release and verification gate (R1)

Run after all in-scope features reach `IN REVIEW`.

Automated:

- Unit tests for money conversion/rounding, shipping weight/rates, and best-seller ranking.
- API tests for shipping admin CRUD, filtered orders, product size chart/weight, tagging/reverse lookup, and checkout validation.
- Integration tests for order creation, Stripe totals, stock rollback, and immutable currency/shipping snapshots.
- Browser tests for `/` routing, Home navigation, currency override, Shop ranking/sorting, size chart, Buy Now, admin shipping UI, order filters, and material search.
- `pnpm lint`
- `pnpm test`
- `pnpm build`

Migration/release:

- Back up production data and rehearse migration on staging.
- Review all products missing weights and all unmapped city-to-district records.
- Seed/verify 64 Bangladesh districts and approved international countries.
- Configure exchange-rate credentials/cache and deployment geo headers.
- Deploy models/APIs compatibly before making new UI fields mandatory.
- Monitor checkout errors, unsupported destinations, exchange-rate fallback, Stripe total mismatches, and aggregation latency.
- Keep a documented rollback path that leaves old orders readable.

Manual acceptance matrix:

| Scenario | Expected result |
|---|---|
| US/EU/UK/China/Bangladesh first visit | Correct detected currency; manual override available |
| Rate provider unavailable | Last-known-good rate or explicit BDT fallback; no mixed totals |
| Cart weighs 0.4/1/2/3.5 kg | Correct minimum/rounding and visible weight/rate |
| Bangladesh district vs international country | District rule vs country-wide rule selected |
| Default Shop vs selected sort/filter | Top 10 default; explicit control wins |
| Product with/without chart | Correct chart shown; empty accordion avoided |
| Buy Now with existing cart | Direct single-item checkout; saved cart preserved |
| Admin Top Selling | Ten ranked rows with units and revenue |
| Payment Pending + order Confirmed | Combined filtered list only |
| Search a product used by several materials | Complete linked raw-material list |

## Risks and controls

| Risk | Control |
|---|---|
| Changing exchange rates alter historical orders | Snapshot canonical amount, displayed amount, currency, rate, provider/version, and timestamp on the order. |
| Client manipulates price/weight/shipping | Re-read products/rules and calculate entirely on the server during checkout. |
| City-to-district migration loses delivery coverage | Dry-run mapping report and explicit manual-review queue before cutover. |
| Best-seller queries slow as orders grow | Index paid-order query fields, cache the aggregation, and measure staging explain plans. |
| Buy Now damages the existing cart | Separate checkout intent; never overwrite persisted cart state. |
| Product/material relationships drift | Stable IDs, one canonical relationship, controlled compatibility migration. |
| Old orders/products break after required fields are introduced | Make fields backward-compatible first, backfill, then enforce them for new writes. |

## Deferred backlog - do not implement in this phase

### Task 10 - Virtual Try-On AI

Status: `DEFERRED`

Later work begins with a separate discovery/estimate covering provider choice vs custom model, garment/user-image requirements, consent/privacy/retention, moderation, latency, per-generation cost, accuracy benchmarks, and a small proof of concept. No Try-On dependency should be added to tasks 1-9.

### Task 11 - Pattern size update

Status: `DEFERRED`

Keep the existing Size 1 / Size 2 values. Resume only after the client supplies the exact approved size list; then plan validation, migration of existing Pattern records, admin UI updates, and regression tests.

## Progress update template

Use this block for each delivery update:

```text
Date:
Cycle:
Completed:
In progress:
Blocked:
Decisions received:
Tests/evidence:
Risks/change to scope:
Next:
```

## Progress log

### 2026-07-28 - Cycle 1, slice 1

- Added backward-compatible Product weight/size-chart fields, Inventory product tags, Order weight/destination/rate snapshots, ShippingZone model, validation, types, and supporting indexes.
- New product writes now require positive weight through a validated admin API. Historical products remain readable until backfill.
- Made Shop the root route and preserved the editorial Home at `/home`; updated navigation and sitemap.
- Added per-product size-chart upload/edit/remove in admin and a conditional responsive storefront accordion.
- Added validated, combined order/payment-status filters, bookmarkable URL state, reset behavior, bounded pagination, and route tests.
- Verification: `pnpm lint`, `pnpm test` (100/100), and `pnpm build` passed.
- Remaining in F0: idempotent backfill/dry-run tooling, 64-district seed data, and ShippingZone admin APIs/UI.

### 2026-07-28 - Cycle 1, slice 2

- Added the shared weight calculation (`max(1, ceil(totalWeightKg))`) and first/additional kg pricing service with focused tests.
- Added authenticated, validated ShippingZone list/create/update/delete APIs and an idempotent Bangladesh 64-district seed operation.
- Added the country-first admin interface: searchable countries/districts, expandable Bangladesh district folder, editable first/additional kg rates, active controls, international country creation, and deletion.
- Kept the legacy city-rate interface available until checkout cutover is complete.
- Added `pnpm migrate:shipping` with dry-run as the default. `--apply`, `--default-weight-kg`, and `--additional-kg-rate` are explicit controls; unmapped legacy cities are reported before writes.
- Verification: `pnpm lint`, `pnpm test` (108/108), and `pnpm build` passed.
- F0 is `IN REVIEW` pending a dry-run against staging data and review of default product weights/unmapped locations.

### 2026-07-28 - Cycle 2, shipping checkout cutover

- Added public active-destination and server-authoritative shipping-quote APIs.
- Checkout now selects country first, requires a Bangladesh district when applicable, accepts international phone numbers, and displays physical weight, chargeable weight, destination, and shipping charge.
- Shipping quotes use server-read Product weights and active ShippingZone rules. Legacy Bangladesh city rates are used only when no district zones have been seeded.
- Order creation re-reads product SKU/name/price/image/weight, recalculates shipping, and snapshots item weights, physical/chargeable totals, destination, rule ID, and shipping cost.
- Stripe uses the immutable order shipping amount; invoice/admin/customer views display destination and weight snapshots.
- Non-BDT shipping rules stay hidden from live checkout until F1 supplies the currency conversion contract.
- Verification: `pnpm lint`, `pnpm test` (114/114), and `pnpm build` passed.
- F2 is `IN REVIEW` pending staging migration, configured-rate review, and real Stripe checkout verification.

### 2026-07-28 - Cycle 2, geo multi-currency

- Added BDT/USD/EUR/GBP/CNY currency selection with trusted Vercel country detection and a one-year manual-override cookie.
- Added a storefront currency selector and shared client money context covering product cards/details, price-filter labels, cart, coupon presentation, shipping, and checkout totals.
- Added a server-side BDT-based Coinbase rate service with daily Next.js caching, warm-instance last-known-good reuse, minor-unit rounding, and safe BDT fallback when no verified rate exists.
- Order creation remains authoritative: canonical BDT item/subtotal/discount/shipping/total values are retained alongside converted charged values, rate, provider source, and timestamp.
- Stripe line items, one-off coupon, shipping, invoices, confirmation email, and order history use the immutable charged currency. Admin revenue aggregations use canonical BDT fields to avoid mixing currencies.
- Product JSON-LD deliberately remains canonical BDT while the visible storefront can change currency.
- Verification: `pnpm lint`, `pnpm test` (129/129), and `pnpm build` passed.
- F1 is `IN REVIEW` pending production Vercel geo-header confirmation, live provider observation, and real Stripe test-mode payments in all five currencies.

### 2026-07-31 - Staging/readiness verification

- Fixed the migration utility so `.env.local` loads before database/models capture environment variables.
- Ran `pnpm migrate:shipping` in dry-run mode against the locally configured `at_patch` database. It performed no writes.
- Dry-run result: 14/14 products have no valid weight; 64/64 legacy Bangladesh locations map to canonical districts; zero unmapped locations.
- Rate review: all 64 legacy locations are active; Dhaka is BDT 80 and the other 63 districts are BDT 120. There are currently zero ShippingZone records, so first/additional kg rates have not been configured in data.
- Did not apply the migration: the default 0.5 kg value would be an unapproved guess for every product.
- Created an isolated Vercel project/deployment for runtime verification. The diagnostic endpoint confirmed `x-vercel-ip-country` was present and trusted on Vercel, a spoofed client value was overwritten, and the manual currency cookie took precedence. Automatic Git integration was disconnected afterward.
- Coinbase returned a live BDT-to-GBP snapshot successfully through the deployed currency endpoint.
- Direct Stripe test-mode PaymentIntents succeeded for BDT, USD, EUR, GBP, and CNY using idempotent verification keys; every result had `livemode: false` and `status: succeeded`.
- Full application Checkout/webhook E2E remains pending because product weights, ShippingZone data, staging database designation, and `STRIPE_WEBHOOK_SECRET` are not configured.
