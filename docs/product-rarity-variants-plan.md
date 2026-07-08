# Product rarity + size/color variants

_Plan only — not yet implemented in this codebase._

## Context

Today every `Product` document is treated as exactly one sellable unit: `status` flips `available → reserved → sold`, there's a single free-text `size` field, and `quantityAvailable`/`isOneOfOne` are stored but never actually read by any business logic (confirmed via repo-wide grep — an earlier "add 4 more of this product" request had to work around this by creating 4 duplicate product documents, since there was no real quantity concept).

Two distinct product types, chosen per-product by the admin:
- **1-of-1** — a single unique piece, one fixed size, exactly like today.
- **Multi-quantity** (default) — one product with several size/color variants, each carrying its own quantity, sold from a shared stock pool.

This touches the data model, the admin product form, the storefront (variant picker, cart, quick-add), and order stock handling — it's a full-stack change, not just a form tweak.

## Decisions locked in

- **Size list** (shared by 1-of-1's single size and each multi-quantity variant): `Baby, XS, S, M, L, XL, XXL`.
- **Color** is free text per variant row (no fixed palette).
- **Stock model**: each variant just has a `quantity` number. Placing an order decrements the matching variant by 1; cancelling an order restores it by 1. No separate reserved/sold sub-status per variant (that stays a 1-of-1-only concept).
- **Quick-add** (the hover "+" on shop grid cards) only shows for 1-of-1 products. Multi-quantity products must be opened to pick a size/color.
- **Cart stays qty-1-per-line**, same as today — adding the same size/color again is a no-op (matches the current "Qty 1 — one of one" assumption already baked into the cart UI). A cart quantity stepper is out of scope unless explicitly requested later.
- **Backward compatibility**: existing products have no `rarity` field yet. Rather than a migration script, all code treats `rarity !== "multi-quantity"` as 1-of-1 (i.e. undefined/missing defaults to 1-of-1) — which is exactly correct since every existing document already behaves like a 1-of-1 unit today.

## Data model

**New file `src/lib/constants.ts`** — single source of truth for the size list:
```ts
export const SIZES = ["Baby", "XS", "S", "M", "L", "XL", "XXL"] as const;
export type Size = (typeof SIZES)[number];
```

**`src/lib/models/Product.ts`**
- Add `rarity: { type: String, enum: ["one-of-one", "multi-quantity"], default: "multi-quantity" }`.
- Change `size` enum to `SIZES`; still used directly when `rarity === "one-of-one"`.
- Add `variants: [{ size: { enum: SIZES }, color: String, quantity: { type: Number, min: 0, default: 0 } }]` (`_id: false` subdocs), used when `rarity === "multi-quantity"`.
- Remove `isOneOfOne` and `quantityAvailable` (dead fields — confirmed unused anywhere outside this model/the admin form/types).
- Add a plain helper (not a Mongoose virtual, since most reads use `.lean()` which drops virtuals) in `src/lib/utils.ts`: `getTotalQuantity(product)` → `1`/`0` for one-of-one based on `status`, else sum of `variants[].quantity`.

**`src/lib/models/Order.ts`** — `OrderItemSchema` gains `size: { type: String, required: true }` and `color: { type: String, default: "" }`, so an order line records exactly which variant was bought.

**Types** (`src/types/product.types.ts`, `src/types/order.types.ts`) — mirror the above: `ProductRarity`, `ProductVariant`, drop `isOneOfOne`/`quantityAvailable`, add `size`/`color` to `OrderItem` and `CreateOrderInput`.

## Stock claiming on order creation (the trickiest part)

**`src/app/api/orders/route.ts`** currently does one batch `find` + one batch `updateMany` across all items. That no longer works once items can be one-of-one *or* variant-based. New approach, per item, done as a loop of atomic claims (no multi-document Mongo transaction — this app has no replica-set transaction support set up, so instead each claim is atomic on its own via a guarded `findOneAndUpdate`, with compensation if a later item fails):

1. For each item, atomically claim stock:
   - One-of-one: `Product.findOneAndUpdate({ _id, status: "available" }, { $set: { status: "reserved" } })`.
   - Multi-quantity: `Product.findOneAndUpdate({ _id, variants: { $elemMatch: { size, color, quantity: { $gte: 1 } } } }, { $inc: { "variants.$.quantity": -1 } })`.
2. If a claim returns null (nothing matched → out of stock), stop and **revert every claim already made in this request** (inverse update for each), then respond 409 like today ("One or more items are no longer available.").
3. If all claims succeed, create the `Order` as today.

**`src/app/api/admin/orders/[id]/route.ts`** (cancel/fulfill) — same per-item branching instead of the current blanket `updateMany`:
- `cancelled`: one-of-one → `status: "available"`; multi-quantity → `$inc` the matching variant `+1`.
- `shipped`/`delivered`: one-of-one → `status: "sold"` (unchanged); multi-quantity → no-op (stock was already permanently decremented at order time under the locked-in model).

## Admin product form (`src/app/admin/(dashboard)/products/page.tsx`)

- New `FormSelect` "Product Rarity": `Multiple quantity` (default) / `One of a kind (1-of-1)` — same pattern already used for Category.
- Conditional section below it:
  - **One-of-one**: single `FormSelect` "Size" from `SIZES` (replaces today's free-text Size input).
  - **Multi-quantity**: a small repeatable row editor — Size (`select`), Color (`FormInput`), Quantity (`FormInput type=number`), remove button per row, "Add size/color" button to append a row, and a computed "Total quantity: N" readout. New local component in the same file, following the file's existing pattern of keeping small form pieces local (like `Field` in checkout/page.tsx).
- `form` state, `handleSubmit` payload, and `startEdit` all extended to carry `rarity`, `size` (one-of-one), `variants` (multi-quantity, quantity kept as string while editing then `Number()`'d on submit — same convention as `price`).
- Products table gets a small stock readout per row using the new `getTotalQuantity` helper (e.g. "1-of-1" vs "12 in stock") since admins currently have no visibility into quantity at all.

## Storefront

- **`src/components/store/AddToCartButton.tsx`** — stays the one-of-one path essentially unchanged, just dispatches `addToCart({ product, size: product.size })` instead of the raw product.
- **New `src/components/store/ProductVariantPicker.tsx`** (client) — multi-quantity path: size buttons → color buttons (scoped to the chosen size, only options with `quantity > 0` enabled) → "Add to Cart", disabled until a valid in-stock variant is chosen, dispatching the same variant-aware `addToCart`. Shows remaining count / "Out of stock" for the selected combo.
- **`src/app/(store)/shop/[slug]/page.tsx`** — at the existing `#add-to-cart` anchor, render `AddToCartButton` for one-of-one (unchanged) or `ProductVariantPicker` for multi-quantity. Replace the hardcoded "Only 1 available" line with `getTotalQuantity`-driven copy for multi-quantity products.
- **`src/components/store/StickyAddToCartBar.tsx`** — one-of-one keeps instant `AddToCartButton`; multi-quantity renders a "Select size" button that scrolls to `#add-to-cart` (that anchor already exists) instead of adding directly.
- **`src/components/store/ProductCard.tsx`** — quick-add "+" button only rendered when `status === "available" && rarity !== "multi-quantity"`.
- **`src/app/(store)/shop/page.tsx`** — `getShopData`'s size facet and `size` filter need to consider variants too: sizes list becomes `Set` of (one-of-one `size`) ∪ (multi-quantity `variants[].size` where `quantity > 0`), sorted by position in `SIZES` rather than alphabetically (alphabetical puts "L" before "M" before "S", wrong for apparel). The `size` query filter becomes an `$or` across `{ size }` and `{ variants: { $elemMatch: { size, quantity: { $gt: 0 } } } }`.

## Cart

- **`src/store/slices/cartSlice.ts`** — `CartLine` gains `size`/`color`. `addToCart` payload becomes `{ product, size, color? }`; dedupe check becomes `productId + size + color` instead of `productId` alone (so two different sizes of the same multi-quantity product can both sit in the cart). `removeFromCart` payload becomes `{ productId, size, color? }` for the same reason.
- **`src/app/(store)/cart/page.tsx`** — row `key` becomes the composite, "Qty 1 — one of one" replaced with the actual size/color, and the remove button passes the full `{ productId, size, color }`.
- **`src/app/(store)/checkout/page.tsx`** — order payload's `items.map(...)` includes `size`/`color` from the cart line (already present in Redux by then, no new lookups needed).

## Verification

1. `tsc --noEmit` + `pnpm lint` after each major group of edits (model/types, then admin form, then storefront/cart) rather than only at the end, given the size of this change.
2. In the browser preview: create one 1-of-1 product and one multi-quantity product (2 sizes, one with 0 stock) via the admin form; confirm the total-quantity readout is correct.
3. Storefront: confirm quick-add only appears on the 1-of-1 card; confirm the multi-quantity PDP shows the size/color picker, blocks the zero-stock combo, and adds the right line to cart; confirm the cart shows the chosen size/color and two different sizes of the same product can coexist as separate lines.
4. Place one order of each type (COD is enough, no need to re-verify Stripe here) and confirm: the 1-of-1 product flips to `reserved`, the multi-quantity variant's `quantity` drops by 1, and cancelling the order in the admin Orders page restores both correctly.
5. Try to order the last unit of a variant twice in two overlapping requests conceptually (or just deplete it to 0 via repeated orders) and confirm the second attempt gets the 409 "no longer available" response instead of overselling.
