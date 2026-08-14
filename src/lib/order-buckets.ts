// The single source of truth for which tab an order belongs to on /admin/orders.
// Every predicate is written once here: the API builds Mongo filters from it, the
// UI reads the same tab union, and the disjointness tests pin the contract.
//
// `now` is always injected rather than read from the clock, so callers (and tests)
// control time instead of computing offsets from the current date.
import type { OrderStatus, PaymentStatus } from "@/types";

export const ORDER_TABS = ["pending", "overdue", "completed", "cancelled"] as const;
export type OrderTab = (typeof ORDER_TABS)[number];

export type OrderTabCounts = Record<OrderTab, number>;

// The fulfillment SLA. A single constant until the number actually starts moving —
// promoting it to an admin setting is deliberately out of scope.
export const OVERDUE_AFTER_DAYS = 3;

// Not finished yet: still somewhere between checkout and the customer's hands.
export const OPEN_STATUSES: OrderStatus[] = ["placed", "confirmed", "processing", "shipped"];

// Still owed to the courier. Once an order ships the fulfillment debt is settled,
// so `shipped` is deliberately absent here while remaining an open status.
export const UNSHIPPED_STATUSES: OrderStatus[] = ["placed", "confirmed", "processing"];

const DAY_MS = 24 * 60 * 60 * 1000;

export function isOrderTab(value: string): value is OrderTab {
  return (ORDER_TABS as readonly string[]).includes(value);
}

/** Orders created before this instant have burned through the SLA window. */
export function overdueCutoff(now: Date): Date {
  return new Date(now.getTime() - OVERDUE_AFTER_DAYS * DAY_MS);
}

/**
 * The Mongo predicate for overdue: paid, still unshipped, and older than the SLA.
 * Unpaid orders are never overdue — an abandoned checkout is a different problem
 * with a different fix, and it stays in Pending.
 */
export function overdueFilter(now: Date): Record<string, unknown> {
  return {
    paymentStatus: "paid" satisfies PaymentStatus,
    status: { $in: UNSHIPPED_STATUSES },
    createdAt: { $lt: overdueCutoff(now) },
  };
}

/**
 * The Mongo filter for one tab. Pending is expressed as "open and not overdue" via
 * a single `$nor` over `overdueFilter`, so disjointness is enforced by one
 * expression rather than duplicated across call sites.
 */
export function buildTabFilter(tab: OrderTab, now: Date): Record<string, unknown> {
  switch (tab) {
    case "overdue":
      return overdueFilter(now);
    case "pending":
      return { status: { $in: OPEN_STATUSES }, $nor: [overdueFilter(now)] };
    case "completed":
      return { status: "delivered" satisfies OrderStatus };
    case "cancelled":
      return { status: "cancelled" satisfies OrderStatus };
  }
}

/** The oldest-late-first ordering for Overdue; every other tab stays newest-first. */
export function tabSort(tab: OrderTab | undefined): Record<string, 1 | -1> {
  return { createdAt: tab === "overdue" ? 1 : -1 };
}

export type BucketableOrder = {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string | Date;
};

export function isOverdue(order: BucketableOrder, now: Date): boolean {
  return (
    order.paymentStatus === "paid" &&
    UNSHIPPED_STATUSES.includes(order.status) &&
    new Date(order.createdAt).getTime() < overdueCutoff(now).getTime()
  );
}

/**
 * The in-memory mirror of `buildTabFilter`. Total over every order status, so the
 * four buckets stay disjoint and exhaustive — adding a status to the enum without
 * bucketing it here is what the matrix test is there to catch.
 */
export function bucketOf(order: BucketableOrder, now: Date): OrderTab {
  if (order.status === "cancelled") return "cancelled";
  if (order.status === "delivered") return "completed";
  return isOverdue(order, now) ? "overdue" : "pending";
}

/** Whole days past the SLA, for the row badge. `0` when the order is not overdue. */
export function daysLate(order: BucketableOrder, now: Date): number {
  if (!isOverdue(order, now)) return 0;
  const elapsed = overdueCutoff(now).getTime() - new Date(order.createdAt).getTime();
  return Math.floor(elapsed / DAY_MS);
}
