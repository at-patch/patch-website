# Dynamic implementation plan - admin order tabs

Status: **Ready**
Scope: **Four-tab order triage on `/admin/orders`**
Planning baseline: 2026-08-11
Baseline commit: `0141e39`

## How to use this plan

Same conventions as `docs/dynamic-plan-tasks-1-9.md`. Update status, owner, blockers, and
evidence each work cycle.

Status values: `BACKLOG`, `READY`, `IN PROGRESS`, `BLOCKED`, `IN REVIEW`, `DONE`.

No task is `DONE` until its API/model work, UI work, automated tests, and manual acceptance
checks are complete.

## Delivery dashboard

| ID | Deliverable | Status | Depends on | Target | Evidence / notes |
|---|---|---|---|---|---|
| O1 | Bucket contract + pure tab logic (`src/lib/order-buckets.ts`) | READY | D11-D14 | Cycle 1 | Pure functions, no DB. The testable core. |
| O2 | Admin orders API: `tab` filter + tab counts | READY | O1 | Cycle 1 | Extends the existing route; keeps current params working |
| O3 | Compound index for tab queries | READY | O1 | Cycle 1 | `{status, paymentStatus, createdAt}` |
| O4 | Tab bar component with live counts | READY | O2 | Cycle 1 | ARIA tablist, URL-synced |
| O5 | Per-tab table rework (columns, badges, mobile, skeletons) | READY | O4 | Cycle 2 | The "looks modern" work |
| O6 | Row actions preserved (status, tracking, refund) | READY | O5 | Cycle 2 | Regression guard on existing behaviour |
| O7 | Acceptance + regression pass | BACKLOG | O1-O6 | Cycle 2 | |
| O8 | Order search box | BACKLOG | O2 | Later | Deliberately out of scope for this round |

## Decisions

Confirmed on 2026-08-11:

| ID | Decision | Resolution |
|---|---|---|
| D11 | What makes an order overdue | **Paid but not shipped, older than the SLA window.** A fulfillment-debt list, not an unpaid-chase list. |
| D12 | Where shipped-not-delivered orders sit | **Pending.** Pending means "not finished yet", so nothing vanishes mid-flight. |
| D13 | Placement | **Rework `/admin/orders`.** The status/payment dropdowns are replaced by tabs; no second orders page. |

Recommended defaults, open to change:

| ID | Decision | Recommended default |
|---|---|---|
| D14 | Are the four buckets disjoint? | **Yes — every order appears in exactly one tab, and the four counts sum to the order total.** An overdue order therefore leaves Pending and appears only under Overdue. The alternative (Overdue as a lens over Pending) keeps Pending complete but double-counts, and makes "how much work is left" ambiguous. |
| D15 | SLA window length | **3 days**, as a single exported constant `OVERDUE_AFTER_DAYS`. Not an admin setting yet — promote it to one only if the number actually starts moving. |
| D16 | What the tab counts count | Counts are computed over **all orders, independent of the active tab**, so the badges are stable as you click between tabs. |
| D17 | Overdue sort order | **Oldest first.** Every other tab stays newest-first. The most-late order is the one you need to see, and it is the one that would otherwise be on the last page. |

## Bucket contract

The single source of truth for what belongs where. Lives in `src/lib/order-buckets.ts` and is
the only place these predicates are written.

```
OPEN_STATUSES      = placed | confirmed | processing | shipped
UNSHIPPED_STATUSES = placed | confirmed | processing

overdue   = paymentStatus == paid
            AND status IN UNSHIPPED_STATUSES
            AND createdAt < now - OVERDUE_AFTER_DAYS

pending   = status IN OPEN_STATUSES AND NOT overdue
completed = status == delivered
cancelled = status == cancelled
```

Properties this must hold, and which O1's tests assert directly:

- **Disjoint** — no order matches two buckets.
- **Exhaustive** — every order matches exactly one bucket.
- **Shipped is never overdue.** Once it is with the courier, the fulfillment debt is settled.
- **Unpaid is never overdue.** An abandoned checkout is a different problem with a different
  fix; it stays in Pending. If chasing unpaid orders becomes a real workflow, it earns its own
  tab rather than being folded into this one.
- **Boundary is strict.** An order at exactly 3 days is not yet overdue.

## Cycle 1 - data and API

### O1. Bucket contract and pure tab logic

New file `src/lib/order-buckets.ts`, following the shape of `src/lib/shop-view.ts` and
`src/lib/best-sellers.ts` — pure, DB-free, unit-tested.

Exports:

- `ORDER_TABS` / `OrderTab` — the tab union, reused by the API validator and the UI.
- `OVERDUE_AFTER_DAYS` — the SLA constant.
- `overdueFilter(now)` — the Mongo predicate for overdue.
- `buildTabFilter(tab, now)` — the Mongo filter per tab, with Pending expressed as
  `{ status: { $in: OPEN_STATUSES }, $nor: [overdueFilter(now)] }` so the disjointness is
  enforced by one expression rather than duplicated across call sites.
- `daysLate(order, now)` — whole days past the SLA, for the row badge. Returns `0` when not
  overdue.

`now` is always injected, never read from the clock inside these functions, so the tests can
pin time instead of computing offsets from the current date.

**Acceptance**

- `src/lib/order-buckets.test.ts` covers: each bucket in isolation; a shipped order that is old
  and paid is Pending, not Overdue; an unpaid 30-day-old order is Pending, not Overdue; exactly
  3 days is not overdue while 3 days plus a minute is; a delivered order that was once late is
  Completed; a cancelled order that was once late is Cancelled.
- A disjointness/exhaustiveness test drives a matrix of every `status × paymentStatus × age`
  combination through the four predicates and asserts exactly one match each. This is the test
  that will catch a future status being added to the enum without being bucketed.

### O2. Admin orders API - tab filter and counts

Extend `src/app/api/admin/orders/route.ts`.

- Accept `?tab=pending|overdue|completed|cancelled`. Unknown value → `400`.
- Keep the existing `status` and `paymentStatus` params working. `route.test.ts` already covers
  them and F8 shipped on them; `tab` composes with them rather than replacing them.
- Validate the query with a Zod schema (`adminOrderQuerySchema`) in
  `src/lib/validation/order.schemas.ts`, so query parsing matches the project's body-parsing
  discipline instead of hand-rolled `Number(...)` coercion.
- Sort: `createdAt` ascending for `tab=overdue` (D17), descending otherwise.
- Return tab counts alongside the page, computed in a single `$facet` aggregation so one round
  trip serves both the rows and all four badges:

```
{ success, data: Order[], total, page, limit,
  tabCounts: { pending, overdue, completed, cancelled } }
```

**Acceptance**

- `route.test.ts` extended: each tab returns only its own orders; invalid tab → 400; `tabCounts`
  is present and sums to the collection total; overdue ordering is oldest-first; existing
  `status`/`paymentStatus` filter tests still pass unchanged.

### O3. Index for the tab queries

`OrderSchema.index({ status: 1, paymentStatus: 1, createdAt: -1 })` in `src/lib/models/Order.ts`.

Every tab query filters on `status`, the overdue path adds `paymentStatus`, and all of them sort
on `createdAt` — one compound index serves the list queries and all four `$facet` branches.
No migration or backfill: every bucket is derived from fields that already exist on every order.

**Acceptance**: `explain()` on the overdue query reports an index scan, not a collection scan.

## Cycle 2 - interface

Design language is already set by `src/components/admin/ui.tsx` — dark surfaces, hairline
`patch-line` borders, `Tone`-driven accent colours, generous `px-6 py-5` cells. The new work
reuses that kit rather than introducing a second visual system.

### O4. Tab bar

A segmented control above the table, not a row of dropdowns.

- Active tab: filled `bg-patch-ink text-patch-bg`, matching the active sidebar pill.
- Inactive: `text-patch-ink-muted`, hover to full `text-patch-ink`.
- Each tab carries a count badge. **Overdue renders its badge in the rust tone whenever the
  count is above zero, including when the tab is not active** — the whole point of the tab is
  to be noticeable from the other three.
- Zero-count tabs render the badge muted rather than hiding it, so the bar does not reflow as
  counts change.
- State lives in the URL (`?tab=overdue`) via `router.replace(..., { scroll: false })`, matching
  the existing filter behaviour, so a tab is linkable and the back button works.
- Semantics: `role="tablist"` / `role="tab"` / `role="tabpanel"`, with left/right arrow-key
  movement between tabs.

### O5. Per-tab table

The tables differ by tab — that is the point, and it is what stops this from being one table
with a filter on top.

| Tab | Columns |
|---|---|
| Pending | Order · Placed · Customer · Items · Total · Payment · Status · Actions |
| Overdue | Order · **Late by** · Placed · Customer · Items · Total · Payment · Status · Actions |
| Completed | Order · Delivered · Customer · Items · Total · Payment · Actions |
| Cancelled | Order · Cancelled · Customer · Total · Payment · Actions |

- **Late by** is a rust `Badge` reading `2 days late`, in the second column where it cannot be
  missed, on a table already sorted worst-first.
- Relative dates (`5d ago`) with the absolute date on hover via `title`.
- Loading renders skeleton rows at the real column widths, so the table does not collapse and
  jump when data lands.
- Empty states are per-tab and specific, using the existing `EmptyState`:
  Overdue empty reads as reassurance ("Nothing overdue — every paid order is inside the
  3-day window"), Cancelled empty is neutral, Pending empty is a genuine all-clear.
- Sticky table header inside the scroll container.
- Below `sm`, rows become stacked cards; an eight-column table cannot be read on a phone, and
  order triage is exactly the thing done away from a desk.

### O6. Preserve existing row actions

`StatusPillSelect` for status, the payment-status control, tracking/carrier save, and the refund
button all survive the rework unchanged in behaviour.

One consequence to handle deliberately: **changing a row's status can move it out of the active
tab.** Marking an overdue order as shipped drops it from Overdue into Pending. The row should
leave with the list refetch and the counts must update in the same pass — list and `tabCounts`
come from one response (O2), so they cannot disagree.

**Acceptance**: shipping an overdue order decrements Overdue and increments Pending; refunding
from Completed leaves the order in Completed with a refunded payment badge.

### O7. Acceptance and regression

- `pnpm lint`, `pnpm test`, `pnpm build` green.
- Manual: seed orders across all four buckets (extend `scripts/seed-dev-commerce-data.ts`),
  including an order at exactly the SLA boundary, and confirm each lands in one tab only.
- Confirm counts sum to the total order count.
- Confirm the F8 URL filters still function.

## Out of scope

- **O8, order search.** A search box changes what the counts mean (D16) and deserves its own
  decision. Not bundled here.
- **Unpaid-order chasing.** Ruled out of Overdue by D11. If it becomes a workflow it gets its
  own tab.
- **Making the SLA admin-configurable.** D15 keeps it a constant until the number moves.
- **Bulk actions.** Multi-select fulfillment is a larger interaction; the tabs should prove
  useful first.
