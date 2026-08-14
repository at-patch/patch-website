import { describe, expect, it } from "vitest";
import {
  ORDER_TABS,
  OPEN_STATUSES,
  OVERDUE_AFTER_DAYS,
  UNSHIPPED_STATUSES,
  bucketOf,
  buildTabFilter,
  daysLate,
  isOverdue,
  overdueCutoff,
  tabSort,
  type BucketableOrder,
  type OrderTab,
} from "./order-buckets";
import type { OrderStatus, PaymentStatus } from "@/types";

const NOW = new Date("2026-08-14T12:00:00.000Z");
const DAY_MS = 24 * 60 * 60 * 1000;

const ALL_STATUSES: OrderStatus[] = ["placed", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const ALL_PAYMENT_STATUSES: PaymentStatus[] = ["pending", "paid", "failed", "refunded"];

function order(
  status: OrderStatus,
  paymentStatus: PaymentStatus,
  ageMs: number
): BucketableOrder {
  return { status, paymentStatus, createdAt: new Date(NOW.getTime() - ageMs) };
}

const days = (n: number) => n * DAY_MS;
const minutes = (n: number) => n * 60 * 1000;

describe("bucketOf", () => {
  it("puts a fresh paid order in Pending", () => {
    expect(bucketOf(order("placed", "paid", days(1)), NOW)).toBe("pending");
  });

  it("puts a paid, unshipped, past-SLA order in Overdue", () => {
    expect(bucketOf(order("processing", "paid", days(10)), NOW)).toBe("overdue");
  });

  it("puts a delivered order in Completed", () => {
    expect(bucketOf(order("delivered", "paid", days(1)), NOW)).toBe("completed");
  });

  it("puts a cancelled order in Cancelled", () => {
    expect(bucketOf(order("cancelled", "refunded", days(1)), NOW)).toBe("cancelled");
  });

  it("keeps a shipped order in Pending no matter how old — shipping settles the debt", () => {
    expect(bucketOf(order("shipped", "paid", days(90)), NOW)).toBe("pending");
    expect(isOverdue(order("shipped", "paid", days(90)), NOW)).toBe(false);
  });

  it("keeps an unpaid 30-day-old order in Pending — chasing payment is a different problem", () => {
    for (const paymentStatus of ["pending", "failed", "refunded"] as PaymentStatus[]) {
      expect(bucketOf(order("placed", paymentStatus, days(30)), NOW)).toBe("pending");
    }
  });

  it("sends a once-late order that got delivered to Completed", () => {
    expect(bucketOf(order("delivered", "paid", days(45)), NOW)).toBe("completed");
  });

  it("sends a once-late order that got cancelled to Cancelled", () => {
    expect(bucketOf(order("cancelled", "paid", days(45)), NOW)).toBe("cancelled");
  });
});

describe("the SLA boundary", () => {
  it("treats exactly the SLA window as not yet overdue", () => {
    expect(isOverdue(order("placed", "paid", days(OVERDUE_AFTER_DAYS)), NOW)).toBe(false);
    expect(bucketOf(order("placed", "paid", days(OVERDUE_AFTER_DAYS)), NOW)).toBe("pending");
  });

  it("treats one minute past the window as overdue", () => {
    const late = order("placed", "paid", days(OVERDUE_AFTER_DAYS) + minutes(1));
    expect(isOverdue(late, NOW)).toBe(true);
    expect(bucketOf(late, NOW)).toBe("overdue");
  });

  it("puts the cutoff exactly OVERDUE_AFTER_DAYS behind now", () => {
    expect(overdueCutoff(NOW).toISOString()).toBe("2026-08-11T12:00:00.000Z");
  });
});

describe("daysLate", () => {
  it("counts whole days past the SLA, not total age", () => {
    expect(daysLate(order("placed", "paid", days(5)), NOW)).toBe(2);
    expect(daysLate(order("confirmed", "paid", days(10)), NOW)).toBe(7);
  });

  it("returns 0 for orders that are not overdue", () => {
    expect(daysLate(order("placed", "paid", days(1)), NOW)).toBe(0);
    expect(daysLate(order("shipped", "paid", days(90)), NOW)).toBe(0);
    expect(daysLate(order("placed", "pending", days(90)), NOW)).toBe(0);
  });

  it("returns 0 for an order that has only just crossed the boundary", () => {
    expect(daysLate(order("placed", "paid", days(OVERDUE_AFTER_DAYS) + minutes(1)), NOW)).toBe(0);
  });
});

// The contract, written out independently of bucketOf's if-chain so the matrix below
// tests the specification rather than restating the implementation.
const CONTRACT: Record<OrderTab, (o: BucketableOrder) => boolean> = {
  overdue: (o) =>
    o.paymentStatus === "paid" &&
    UNSHIPPED_STATUSES.includes(o.status) &&
    new Date(o.createdAt).getTime() < overdueCutoff(NOW).getTime(),
  pending: (o) => OPEN_STATUSES.includes(o.status) && !CONTRACT.overdue(o),
  completed: (o) => o.status === "delivered",
  cancelled: (o) => o.status === "cancelled",
};

describe("the four buckets are disjoint and exhaustive", () => {
  const ages = [
    days(0),
    days(1),
    days(OVERDUE_AFTER_DAYS),
    days(OVERDUE_AFTER_DAYS) + minutes(1),
    days(30),
  ];

  const matrix = ALL_STATUSES.flatMap((status) =>
    ALL_PAYMENT_STATUSES.flatMap((paymentStatus) =>
      ages.map((age) => order(status, paymentStatus, age))
    )
  );

  it("matches every status x paymentStatus x age combination exactly once", () => {
    expect(matrix).toHaveLength(ALL_STATUSES.length * ALL_PAYMENT_STATUSES.length * ages.length);

    for (const candidate of matrix) {
      const matched = ORDER_TABS.filter((tab) => CONTRACT[tab](candidate));
      expect(
        matched,
        `${candidate.status}/${candidate.paymentStatus} at ${new Date(candidate.createdAt).toISOString()}`
      ).toHaveLength(1);
    }
  });

  it("agrees with bucketOf across the whole matrix", () => {
    for (const candidate of matrix) {
      const expected = ORDER_TABS.find((tab) => CONTRACT[tab](candidate));
      expect(bucketOf(candidate, NOW)).toBe(expected);
    }
  });
});

describe("buildTabFilter", () => {
  it("expresses Pending as open-and-not-overdue in one expression", () => {
    expect(buildTabFilter("pending", NOW)).toEqual({
      status: { $in: OPEN_STATUSES },
      $nor: [
        {
          paymentStatus: "paid",
          status: { $in: UNSHIPPED_STATUSES },
          createdAt: { $lt: overdueCutoff(NOW) },
        },
      ],
    });
  });

  it("filters Overdue on paid, unshipped, and past the cutoff", () => {
    expect(buildTabFilter("overdue", NOW)).toEqual({
      paymentStatus: "paid",
      status: { $in: UNSHIPPED_STATUSES },
      createdAt: { $lt: overdueCutoff(NOW) },
    });
  });

  it("maps the terminal tabs to a single status", () => {
    expect(buildTabFilter("completed", NOW)).toEqual({ status: "delivered" });
    expect(buildTabFilter("cancelled", NOW)).toEqual({ status: "cancelled" });
  });
});

describe("tabSort", () => {
  it("sorts Overdue oldest-first so the latest order is never on the last page", () => {
    expect(tabSort("overdue")).toEqual({ createdAt: 1 });
  });

  it("sorts every other tab newest-first", () => {
    expect(tabSort("pending")).toEqual({ createdAt: -1 });
    expect(tabSort("completed")).toEqual({ createdAt: -1 });
    expect(tabSort("cancelled")).toEqual({ createdAt: -1 });
    expect(tabSort(undefined)).toEqual({ createdAt: -1 });
  });
});
