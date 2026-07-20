import { describe, expect, it, vi } from "vitest";

async function loadHelper() {
  vi.resetModules();

  const updateMany = vi.fn().mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
  vi.doMock("@/lib/models/Order", () => ({
    default: {
      updateMany,
    },
  }));

  const orderClaims = await import("./order-claims");
  return { ...orderClaims, updateMany };
}

describe("claimGuestOrdersForCustomer", () => {
  it("links only unclaimed orders matching the normalized email", async () => {
    const { claimGuestOrdersForCustomer, updateMany } = await loadHelper();

    await claimGuestOrdersForCustomer({
      customerId: "customer-1",
      email: "  Ada@Example.COM  ",
    });

    expect(updateMany).toHaveBeenCalledWith(
      {
        "shippingAddress.email": "ada@example.com",
        $or: [{ customer: { $exists: false } }, { customer: null }],
      },
      { $set: { customer: "customer-1" } }
    );
  });

  it("does nothing when customer id or email is missing", async () => {
    const { claimGuestOrdersForCustomer, updateMany } = await loadHelper();

    await expect(claimGuestOrdersForCustomer({ customerId: "", email: "ada@example.com" })).resolves.toEqual({
      matchedCount: 0,
      modifiedCount: 0,
    });
    await expect(claimGuestOrdersForCustomer({ customerId: "customer-1", email: " " })).resolves.toEqual({
      matchedCount: 0,
      modifiedCount: 0,
    });

    expect(updateMany).not.toHaveBeenCalled();
  });
});
