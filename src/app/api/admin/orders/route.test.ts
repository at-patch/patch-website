import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { OPEN_STATUSES, UNSHIPPED_STATUSES, overdueCutoff } from "@/lib/order-buckets";

const { find, countDocuments, aggregate } = vi.hoisted(() => ({
  find: vi.fn(),
  countDocuments: vi.fn(),
  aggregate: vi.fn(),
}));

vi.mock("@/lib/require-admin", () => ({
  requireAdmin: vi.fn().mockResolvedValue({ email: "admin@example.com" }),
}));
vi.mock("@/lib/db", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/models/Order", () => ({
  default: { find, countDocuments, aggregate },
}));

import { GET } from "./route";

const NOW = new Date("2026-08-14T12:00:00.000Z");

function request(query = "") {
  return { url: `http://localhost/api/admin/orders${query}` } as never;
}

let sort: ReturnType<typeof vi.fn>;

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterAll(() => {
  vi.useRealTimers();
});

beforeEach(() => {
  vi.clearAllMocks();
  countDocuments.mockResolvedValue(1);
  const limit = vi.fn().mockResolvedValue([{ orderNumber: "PAT-001" }]);
  const skip = vi.fn().mockReturnValue({ limit });
  sort = vi.fn().mockReturnValue({ skip });
  find.mockReturnValue({ sort });
  aggregate.mockResolvedValue([
    { pending: [{ count: 4 }], overdue: [{ count: 2 }], completed: [{ count: 3 }], cancelled: [{ count: 1 }] },
  ]);
});

describe("admin orders list filters", () => {
  it("combines order and payment status filters", async () => {
    const response = await GET(request("?status=confirmed&paymentStatus=pending"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(find).toHaveBeenCalledWith({ status: "confirmed", paymentStatus: "pending" });
    expect(countDocuments).toHaveBeenCalledWith({ status: "confirmed", paymentStatus: "pending" });
    expect(body).toMatchObject({ success: true, total: 1, page: 1, limit: 50 });
  });

  it("rejects invalid filter values", async () => {
    const response = await GET(request("?paymentStatus=overdue"));

    expect(response.status).toBe(400);
    expect(find).not.toHaveBeenCalled();
  });

  it("treats an empty filter value as no filter", async () => {
    const response = await GET(request("?status=&paymentStatus="));

    expect(response.status).toBe(200);
    expect(find).toHaveBeenCalledWith({});
  });

  it("falls back rather than erroring on an unusable page value", async () => {
    const response = await GET(request("?page=abc"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ page: 1, limit: 50 });
  });
});

describe("tab filtering", () => {
  it("filters Overdue to paid, unshipped orders past the cutoff", async () => {
    await GET(request("?tab=overdue"));

    expect(find).toHaveBeenCalledWith({
      paymentStatus: "paid",
      status: { $in: UNSHIPPED_STATUSES },
      createdAt: { $lt: overdueCutoff(NOW) },
    });
  });

  it("filters Pending to open orders that are not overdue", async () => {
    await GET(request("?tab=pending"));

    expect(find).toHaveBeenCalledWith({
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

  it("filters the terminal tabs to a single status", async () => {
    await GET(request("?tab=completed"));
    expect(find).toHaveBeenCalledWith({ status: "delivered" });

    vi.clearAllMocks();
    find.mockReturnValue({ sort });
    countDocuments.mockResolvedValue(1);
    aggregate.mockResolvedValue([{}]);

    await GET(request("?tab=cancelled"));
    expect(find).toHaveBeenCalledWith({ status: "cancelled" });
  });

  it("composes a tab with the existing status filter instead of overwriting it", async () => {
    await GET(request("?tab=pending&status=shipped"));

    expect(find).toHaveBeenCalledWith({
      $and: [
        {
          status: { $in: OPEN_STATUSES },
          $nor: [
            {
              paymentStatus: "paid",
              status: { $in: UNSHIPPED_STATUSES },
              createdAt: { $lt: overdueCutoff(NOW) },
            },
          ],
        },
        { status: "shipped" },
      ],
    });
  });

  it("rejects an unknown tab", async () => {
    const response = await GET(request("?tab=archived"));

    expect(response.status).toBe(400);
    expect(find).not.toHaveBeenCalled();
  });

  it("sorts Overdue oldest-first and every other tab newest-first", async () => {
    await GET(request("?tab=overdue"));
    expect(sort).toHaveBeenCalledWith({ createdAt: 1 });

    for (const tab of ["pending", "completed", "cancelled", ""]) {
      vi.clearAllMocks();
      find.mockReturnValue({ sort });
      countDocuments.mockResolvedValue(1);
      aggregate.mockResolvedValue([{}]);

      await GET(request(tab ? `?tab=${tab}` : ""));
      expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
    }
  });
});

describe("tab counts", () => {
  it("returns a count for every tab from a single aggregation", async () => {
    const response = await GET(request("?tab=overdue"));
    const body = await response.json();

    expect(aggregate).toHaveBeenCalledTimes(1);
    expect(body.tabCounts).toEqual({ pending: 4, overdue: 2, completed: 3, cancelled: 1 });
  });

  it("counts all orders regardless of the active tab, so the badges sum to the total", async () => {
    const overdueBody = await (await GET(request("?tab=overdue"))).json();
    const completedBody = await (await GET(request("?tab=completed"))).json();

    expect(overdueBody.tabCounts).toEqual(completedBody.tabCounts);
    const sum = Object.values(overdueBody.tabCounts as Record<string, number>).reduce((a, b) => a + b, 0);
    expect(sum).toBe(10);
  });

  it("reports zero for buckets the aggregation returned no rows for", async () => {
    aggregate.mockResolvedValue([{ pending: [{ count: 2 }] }]);

    const body = await (await GET(request())).json();

    expect(body.tabCounts).toEqual({ pending: 2, overdue: 0, completed: 0, cancelled: 0 });
  });
});
