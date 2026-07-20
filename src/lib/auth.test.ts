import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  process.env.ADMIN_JWT_SECRET = "test-admin-secret";
});

describe("admin session tokens", () => {
  it("round-trips an admin payload through create/verify", async () => {
    const { createAdminToken, verifyAdminToken } = await import("./auth");
    const token = await createAdminToken({ sub: "admin-1", email: "owner@patch.test", role: "owner" });
    const payload = await verifyAdminToken(token);
    expect(payload).toMatchObject({ sub: "admin-1", email: "owner@patch.test", role: "owner" });
  });

  it("rejects a garbage token instead of throwing", async () => {
    const { verifyAdminToken } = await import("./auth");
    const payload = await verifyAdminToken("not-a-real-token");
    expect(payload).toBeNull();
  });

  it("a customer token is not accepted as an admin token", async () => {
    process.env.CUSTOMER_JWT_SECRET = "different-secret-entirely";
    const { createCustomerToken } = await import("./customer-auth");
    const { verifyAdminToken } = await import("./auth");

    const customerToken = await createCustomerToken("customer-123");
    const payload = await verifyAdminToken(customerToken);
    expect(payload).toBeNull();
  });
});
