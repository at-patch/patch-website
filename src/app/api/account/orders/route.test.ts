import { describe, expect, it, vi } from "vitest";

async function loadRoute({ customer, customerId = "customer-1" }: { customer: unknown; customerId?: string | null }) {
  vi.resetModules();

  const sort = vi.fn().mockResolvedValue([{ orderNumber: "PATCH-1" }]);
  const orderFind = vi.fn().mockReturnValue({ sort });
  const lean = vi.fn().mockResolvedValue(customer);
  const select = vi.fn().mockReturnValue({ lean });
  const findById = vi.fn().mockReturnValue({ select });
  const claimGuestOrdersForCustomer = vi.fn().mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

  vi.doMock("@/lib/require-customer", () => ({ requireCustomer: vi.fn().mockResolvedValue(customerId) }));
  vi.doMock("@/lib/db", () => ({ connectToDatabase: vi.fn().mockResolvedValue(undefined) }));
  vi.doMock("@/lib/models/Customer", () => ({
    default: {
      findById,
    },
  }));
  vi.doMock("@/lib/models/Order", () => ({
    default: {
      find: orderFind,
    },
  }));
  vi.doMock("@/lib/order-claims", () => ({ claimGuestOrdersForCustomer }));

  const route = await import("./route");
  return { route, findById, orderFind, claimGuestOrdersForCustomer };
}

describe("account orders route", () => {
  it("claims matching guest orders for verified customers before listing by customer id", async () => {
    const { route, orderFind, claimGuestOrdersForCustomer } = await loadRoute({
      customer: { _id: "customer-1", email: "ada@example.com", emailVerified: true },
    });

    const response = await route.GET({ url: "http://localhost/api/account/orders" } as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(claimGuestOrdersForCustomer).toHaveBeenCalledWith({
      customerId: "customer-1",
      email: "ada@example.com",
    });
    expect(orderFind).toHaveBeenCalledWith({ customer: "customer-1" });
    expect(body).toMatchObject({ success: true, total: 1 });
  });

  it("does not claim guest orders for unverified customers", async () => {
    const { route, claimGuestOrdersForCustomer } = await loadRoute({
      customer: { _id: "customer-1", email: "ada@example.com", emailVerified: false },
    });

    const response = await route.GET({ url: "http://localhost/api/account/orders" } as never);

    expect(response.status).toBe(200);
    expect(claimGuestOrdersForCustomer).not.toHaveBeenCalled();
  });

  it("rejects a session when the customer no longer exists", async () => {
    const { route, orderFind } = await loadRoute({ customer: null });

    const response = await route.GET({ url: "http://localhost/api/account/orders" } as never);

    expect(response.status).toBe(401);
    expect(orderFind).not.toHaveBeenCalled();
  });
});
