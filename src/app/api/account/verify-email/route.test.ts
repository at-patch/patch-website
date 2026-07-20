import { describe, expect, it, vi } from "vitest";

function postRequest(body: unknown) {
  return {
    url: "http://localhost/api/account/verify-email",
    json: vi.fn().mockResolvedValue(body),
  } as never;
}

async function loadRoute(customer: unknown) {
  vi.resetModules();

  const findOneAndUpdate = vi.fn().mockResolvedValue(customer);
  const claimGuestOrdersForCustomer = vi.fn().mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

  vi.doMock("@/lib/db", () => ({ connectToDatabase: vi.fn().mockResolvedValue(undefined) }));
  vi.doMock("@/lib/rate-limit", () => ({
    getRequestIp: vi.fn().mockReturnValue("127.0.0.1"),
    isRateLimited: vi.fn().mockResolvedValue(false),
    makeLimiter: vi.fn().mockReturnValue({}),
  }));
  vi.doMock("@/lib/models/Customer", () => ({
    default: {
      findOneAndUpdate,
    },
  }));
  vi.doMock("@/lib/order-claims", () => ({ claimGuestOrdersForCustomer }));

  const route = await import("./route");
  return { route, findOneAndUpdate, claimGuestOrdersForCustomer };
}

describe("verify email route", () => {
  it("claims matching guest orders after successful verification", async () => {
    const { route, claimGuestOrdersForCustomer } = await loadRoute({
      _id: { toString: () => "customer-1" },
      email: "ada@example.com",
    });

    const response = await route.POST(postRequest({ token: "verify-token" }));

    expect(response.status).toBe(200);
    expect(claimGuestOrdersForCustomer).toHaveBeenCalledWith({
      customerId: "customer-1",
      email: "ada@example.com",
    });
  });

  it("does not claim orders for invalid or expired tokens", async () => {
    const { route, claimGuestOrdersForCustomer } = await loadRoute(null);

    const response = await route.POST(postRequest({ token: "expired-token" }));

    expect(response.status).toBe(400);
    expect(claimGuestOrdersForCustomer).not.toHaveBeenCalled();
  });
});
