import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  process.env.CUSTOMER_JWT_SECRET = "test-customer-secret";
});

describe("customer session tokens", () => {
  it("round-trips a customer id through create/verify", async () => {
    const { createCustomerToken, verifyCustomerToken } = await import("./customer-auth");
    const token = await createCustomerToken("customer-123");
    const payload = await verifyCustomerToken(token);
    expect(payload?.sub).toBe("customer-123");
  });

  it("rejects a garbage token instead of throwing", async () => {
    const { verifyCustomerToken } = await import("./customer-auth");
    const payload = await verifyCustomerToken("not-a-real-token");
    expect(payload).toBeNull();
  });
});

describe("one-time account tokens", () => {
  it("generates a token whose hash matches hashAccountToken of the raw value", async () => {
    const { generateAccountToken, hashAccountToken } = await import("./customer-auth");
    const { token, hash } = generateAccountToken();
    expect(hash).toBe(hashAccountToken(token));
  });

  it("produces a different token on every call", async () => {
    const { generateAccountToken } = await import("./customer-auth");
    const a = generateAccountToken();
    const b = generateAccountToken();
    expect(a.token).not.toBe(b.token);
    expect(a.hash).not.toBe(b.hash);
  });

  it("hashing is deterministic for the same input", async () => {
    const { hashAccountToken } = await import("./customer-auth");
    expect(hashAccountToken("abc")).toBe(hashAccountToken("abc"));
    expect(hashAccountToken("abc")).not.toBe(hashAccountToken("abd"));
  });
});
