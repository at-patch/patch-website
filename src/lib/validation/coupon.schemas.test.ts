import { describe, expect, it } from "vitest";
import { createCouponSchema, validateCouponSchema } from "./coupon.schemas";

describe("validateCouponSchema", () => {
  it("rejects a negative subtotal", () => {
    expect(validateCouponSchema.safeParse({ code: "WELCOME10", subtotal: -1 }).success).toBe(false);
  });

  it("rejects an empty code", () => {
    expect(validateCouponSchema.safeParse({ code: "  ", subtotal: 100 }).success).toBe(false);
  });
});

describe("createCouponSchema", () => {
  it("applies defaults for optional fields", () => {
    const result = createCouponSchema.safeParse({ code: "SAVE10", type: "percent", value: 10 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.minSubtotal).toBe(0);
      expect(result.data.usageLimit).toBe(0);
      expect(result.data.active).toBe(true);
    }
  });

  it("rejects a type outside percent/flat", () => {
    const result = createCouponSchema.safeParse({ code: "SAVE10", type: "bogus", value: 10 });
    expect(result.success).toBe(false);
  });

  it("rejects a negative value", () => {
    const result = createCouponSchema.safeParse({ code: "SAVE10", type: "flat", value: -5 });
    expect(result.success).toBe(false);
  });

  it("accepts a null expiresAt", () => {
    const result = createCouponSchema.safeParse({
      code: "SAVE10",
      type: "flat",
      value: 100,
      expiresAt: null,
    });
    expect(result.success).toBe(true);
  });
});
