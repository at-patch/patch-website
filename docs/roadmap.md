# at_patch_web — Current Roadmap & LLM Handoff

_Last updated: 2026-07-22 • repository state: storefront/admin client task pass in progress • verification: `pnpm lint`, `pnpm test` 92/92 passing, `pnpm build` passing._

## Product and technical baseline

`at_patch_web` is a Next.js 16 App Router storefront and admin dashboard for an apparel/patch shop. It uses MongoDB/Mongoose, Redux Toolkit + redux-persist for the cart, cookie-based JWT sessions for customers and admins, Cloudinary uploads, Stripe Checkout, Resend, Upstash rate limiting, and a Google Vertex-powered chat assistant.

The app is substantially beyond the 2026-07-08 codebase audit. The original launch-blocking wishlist, newsletter, contact inbox, rate limiting, payment, checkout, customer-account, admin, chat, SEO, validation, and testing work has been implemented. Product rarity and size/color variant support from `docs/product-rarity-variants-plan.md` has also been implemented in the main code paths. The principal work left is production readiness, real end-to-end payment/provider testing, CI setup, and the selected enhancements below.

## Done

### Commerce and launch foundations

- **Checkout and payments:** Checkout creates inventory-reserved orders, supports **Stripe-hosted card checkout only**, and redirects card payments to Stripe. Cash on Delivery has been removed from the live checkout path by business decision. The signed Stripe webhook transitions pending orders to paid or failed, stores the payment intent, and releases inventory on failed/expired payments. Success and cancellation states are reflected in the storefront.
- **Order operations:** Customers can cancel eligible placed/confirmed orders. Admins can update order/shipping status, carrier, and tracking number; issue Stripe refunds for paid card orders; and the customer order history displays fulfillment/refund details.
- **Coupons:** Coupon model, admin CRUD at `/admin/coupons`, cart application/validation, server-side revalidation and atomic use claims, Stripe discount forwarding, and cleanup on failed checkout are all present.
- **Wishlist:** Persisted customer wishlist API, product heart control, and `/account/wishlist` page are live.
- **Newsletter and contact:** Newsletter emails are persisted. Contact messages are persisted, shown in `/admin/contact`, can be marked resolved, and trigger a best-effort Resend notification.
- **Product rarity and variants:** Products now support `one-of-one` and `multi-quantity` rarity. Multi-quantity products carry size/color/quantity variants, admins can edit those variants, storefront product pages show a variant picker, shop size filters include in-stock variants, quick-add stays limited to 1-of-1 products, and cart lines are keyed by product + size + color.
- **Inventory safety:** Product stock is claimed atomically while an order is created and released when checkout fails/cancels; one-of-one products use `available/reserved/sold`, while multi-quantity products decrement and restore the matching variant quantity. Refunds before shipment also release stock.

### Accounts, admin, and security

- **Customer auth:** Login, registration, protected account routes, password reset, verification email, resend verification, token expiry/hash handling, and sensitive-field stripping on `/api/account/me` are implemented.
- **Admin auth and roles:** First login bootstraps an owner from `ADMIN_EMAIL` / `ADMIN_PASSWORD`; thereafter admins are stored in MongoDB. Owners can manage staff admins in `/admin/admins`; role/active status is enforced server-side.
- **Rate limiting:** Admin login, customer login/register, password-reset, verification resend, and contact submission have fail-open Upstash sliding-window limits.
- **API validation:** Shared Zod parsing and schemas cover the auth, order/checkout, coupon, and admin-order mutation boundaries. The admin order route has an explicit allowlist to prevent mass assignment.

### Storefront experience, discovery, and operations

- **Chat assistant:** It can query live products/availability, look up an order only when given both order number and matching checkout email, and persist consented leads. Leads are manageable in `/admin/leads`. Product search results are variant-aware, and the system prompt now distinguishes one-of-one pieces (non-standard sizing) from limited-batch pieces (standard sizes/colors, tiny per-variant stock).
- **Product search:** Name, description, and SKU matching are supported, with user input escaped before regex querying.
- **SEO and resilience:** Root and product/journal metadata (including Open Graph/Twitter), `robots.ts`, `sitemap.ts`, page loading skeletons, and scoped error/not-found boundaries are implemented.
- **Journal:** Cover images render on listing, detail, and related cards; Facebook/X share links work.
- **Admin analytics and observability basics:** The dashboard provides revenue/trend/top-product views, and server failures use the shared logger.
- **Shipping utilities:** Admins can manage Bangladesh shipping cities and per-city shipping costs in `/admin/utilities`. Checkout requires an active city, snapshots the city and shipping cost onto the order, and includes shipping in the Stripe checkout total.
- **Internal raw-material tracking:** Inventory has been reshaped around the client spreadsheet fields, and Patterns are available as a separate internal admin resource with `INV-####` / `PAT-####` code generation plus optional starter records.
- **Editable content:** Homepage promo banners and the About/Story page copy/images are editable by any admin.
- **Storefront task pass:** Header includes Home, the primary green theme token has moved to purple, hero Buy Now points to `/shop`, category cards reveal on scroll, and checkout/product policy copy now states no cash refunds/returns with size/fit exchange within 7 days.
- **Automated checks:** Vitest is configured with 71 unit tests across cart behavior, auth/token behavior, coupon math, validation schemas, utility behavior, admin authorization, and inventory claim/release for both rarities. `pnpm test` and `pnpm lint` are green.

## Open work — do next

### 0. Production-launch checklist (must complete before accepting real orders)

This is configuration and verification work, not primarily new application code.

1. Provision production MongoDB, Cloudinary, Resend, Upstash, Google Vertex, Stripe, and all secrets in the deployment environment. Use `.env.example` as the complete variable checklist; never commit real keys or service-account JSON.
2. Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS domain, configure Stripe webhook delivery to `/api/payments/stripe/webhook`, and set `STRIPE_WEBHOOK_SECRET` from that endpoint.
3. Perform Stripe test-mode end-to-end checks: successful card payment, cancelled checkout, expired/failed payment, duplicate webhook delivery, a coupon checkout, customer cancellation, and admin refund. Confirm each produces the expected order/payment/inventory result in MongoDB.
4. Perform COD end-to-end checks: stock reservation, order confirmation, admin fulfillment/tracking update, customer cancellation, and stock release.
5. Verify transactional email delivery and sender/domain configuration for contact alerts, registration verification, and password reset. These sends are intentionally best-effort, so monitor logs while testing.
6. Create the first owner once, then create least-privilege staff admins; remove/rotate bootstrap `ADMIN_PASSWORD` after bootstrapping.
7. Add deployment monitoring/alerting, backups, and a recovery owner. The current `logger` is a minimal foundation, not an external error-tracking service.

### 1. Payment method decision: bKash/Nagad (business decision, then implementation)

The storefront deliberately exposes only Stripe card payments. COD has been removed from checkout. The existing `/api/payments/bkash` and `/api/payments/nagad` endpoints return `501`; their credentials remain documented as dormant sandbox variables.

If Bangladesh-local wallet payment is required, implement one provider at a time end-to-end: signed/tokenized payment initialization, redirect UI, callback/webhook signature verification and idempotency, order payment transitions, cancellation/timeout handling, refund policy, and sandbox/production tests. Do **not** add either payment option to checkout until that is complete.

### 2. Clean up the completed rarity/variant rollout

1. ~~Update chat assistant copy in `src/app/api/chat/route.ts`~~ — **done**: the system prompt now separates one-of-one (non-standard sizing) from limited-batch (standard sizes/colors, tiny per-variant stock).
2. ~~Add focused tests for `src/lib/inventory.ts`~~ — **done**: `src/lib/inventory.test.ts` covers 1-of-1 claim/release, multi-quantity variant decrement/restore, color normalization, out-of-stock rejection, and mixed-rarity `releaseOrderStock`. Route-level compensation when a later cart item cannot be claimed is still open under section 3.1.
3. Manually verify the admin + storefront variant flow against a real MongoDB dataset: create/edit one 1-of-1 product and one multi-quantity product, add multiple variants to cart, place a COD order, cancel it, and confirm the exact variant quantities are restored.
4. Decide whether `docs/product-rarity-variants-plan.md` should be expanded into a final implementation note or deleted after the manual verification is complete; it is now marked historical so it should not be treated as the active roadmap.
5. Review legacy data/backward compatibility in production: existing products without `rarity` are intentionally treated as 1-of-1, while new admin-created products default to multi-quantity.

### 3. Strengthen test coverage and delivery controls

1. Add route/integration tests against an isolated MongoDB or test container for order creation, stock/coupon races, Stripe webhook idempotency, cancellation, and refunds.
2. Add browser E2E coverage for register/verify/reset, cart/coupon, COD checkout, Stripe redirect setup, admin order workflow, and role permissions.
3. ~~Add CI to run `pnpm lint`, `pnpm test`, and `pnpm build` on every pull request.~~ — **done**: `.github/workflows/ci.yml` runs all three on PRs to `main` and pushes to `main` (Node 24, pnpm 10, frozen lockfile). Still to do: make the check required for merge and surface status to maintainers via branch protection.

### 4. Security and operational hardening

1. Replace fail-open rate limiting for production-sensitive endpoints with an explicit policy: alert on Upstash failure and decide whether login/payment endpoints should fail closed.
2. Add CSRF protection / origin validation for cookie-authenticated state-changing routes, and audit authorization ownership on every customer-facing order/address mutation.
3. Introduce structured, centralized error tracking (for example Sentry) with request correlation and secret/PII scrubbing; add health/readiness endpoints and uptime monitoring.
4. Define data retention/deletion procedures for customers, subscribers, contact messages, and chat leads; publish required privacy/terms/returns pages.
5. Add database indexes and backup/restore drills for the query patterns that grow with orders, products, leads, contacts, and subscribers.

### 5. Product and storefront improvements

1. Replace placeholder social URLs in the footer and contact page (`href="#"`) with real profiles or remove them.
2. Decide whether newsletter subscribers should sync to an email-marketing provider (Klaviyo/Mailchimp/etc.) and implement consent/unsubscribe/double-opt-in as needed.
3. Add an internal exception workflow if the business wants a formal record for phone-approved refunds; today storefront copy says no cash refunds/returns, while admins can still manually manage status/refunds.
4. Add richer delivery/shipping rules, shipment notifications, and possibly carrier tracking links when operations require them.
5. Improve catalog search further with Mongo text/Atlas Search, filters, sorting, and pagination when catalog size or search quality demands it.
6. Add product structured data (JSON-LD), canonical/alternate URL review, and analytics/conversion instrumentation.
7. Consider image optimization, accessibility audit, and performance profiling after real production content/assets are available.

## Suggested execution order

1. Complete the production-launch checklist and validate Stripe + COD in the real staging environment.
2. ~~Put CI in place with `pnpm lint`, `pnpm test`, and `pnpm build`.~~ — done via `.github/workflows/ci.yml`; add branch protection to require it.
3. Finish the rarity/variant cleanup pass: chat copy, focused inventory tests, and one real MongoDB manual flow.
4. Decide whether bKash or Nagad is actually required; scope and ship one provider if yes.
5. Address security/ops hardening in parallel with the first production period.
6. Prioritize storefront enhancements from customer feedback and business operations.

## Handoff constraints for another LLM

- Preserve the existing payment truth model: only Stripe webhook-confirmed card orders are `paid`; COD is no longer a live checkout method.
- Treat `bKash` and `Nagad` routes as intentionally dormant, not partially working integrations.
- Keep inventory and coupon claims atomic and reversible whenever altering checkout, cancellation, payment failure, or refund flows.
- Keep variant identity stable as `product + size + color`; changing cart/order line shape must preserve existing checkout and stock compensation behavior.
- Use the shared Zod request parser for new JSON API boundaries and add focused Vitest coverage with each change.
- Respect admin roles with `requireAdmin`; do not rely only on UI gating.
- Run `pnpm test` and `pnpm lint` after changes; run `pnpm build` for release candidates.
