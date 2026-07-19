import { beforeEach, describe, expect, it, vi } from "vitest";
import CouponModel from "./models/Coupon";
import { checkCoupon } from "./coupons";

vi.mock("./models/Coupon", () => ({
  default: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    updateOne: vi.fn(),
  },
}));

function mockFoundCoupon(coupon: Record<string, unknown> | null) {
  vi.mocked(CouponModel.findOne).mockReturnValue({
    lean: () => Promise.resolve(coupon),
  } as never);
}

const baseCoupon = {
  code: "WELCOME10",
  type: "percent",
  value: 10,
  minSubtotal: 0,
  expiresAt: null,
  usageLimit: 0,
  usedCount: 0,
  active: true,
};

describe("checkCoupon", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a blank code without hitting the database", async () => {
    const result = await checkCoupon("   ", 1000);
    expect(result).toEqual({ ok: false, message: "Enter a discount code." });
    expect(CouponModel.findOne).not.toHaveBeenCalled();
  });

  it("rejects a code that doesn't exist", async () => {
    mockFoundCoupon(null);
    const result = await checkCoupon("NOPE", 1000);
    expect(result.ok).toBe(false);
  });

  it("rejects an inactive coupon", async () => {
    mockFoundCoupon({ ...baseCoupon, active: false });
    const result = await checkCoupon("WELCOME10", 1000);
    expect(result.ok).toBe(false);
  });

  it("rejects an expired coupon", async () => {
    mockFoundCoupon({ ...baseCoupon, expiresAt: new Date("2000-01-01") });
    const result = await checkCoupon("WELCOME10", 1000);
    expect(result).toMatchObject({ ok: false, message: expect.stringContaining("expired") });
  });

  it("rejects a coupon that has hit its usage limit", async () => {
    mockFoundCoupon({ ...baseCoupon, usageLimit: 5, usedCount: 5 });
    const result = await checkCoupon("WELCOME10", 1000);
    expect(result).toMatchObject({ ok: false, message: expect.stringContaining("redeemed") });
  });

  it("rejects a subtotal below the coupon's minimum", async () => {
    mockFoundCoupon({ ...baseCoupon, minSubtotal: 2000 });
    const result = await checkCoupon("WELCOME10", 1000);
    expect(result.ok).toBe(false);
  });

  it("computes a rounded percent discount", async () => {
    mockFoundCoupon({ ...baseCoupon, type: "percent", value: 10 });
    const result = await checkCoupon("welcome10", 999);
    expect(result).toEqual({ ok: true, code: "WELCOME10", discount: 100 });
  });

  it("caps a flat discount at the subtotal so total never goes negative", async () => {
    mockFoundCoupon({ ...baseCoupon, type: "flat", value: 5000 });
    const result = await checkCoupon("WELCOME10", 1000);
    expect(result).toEqual({ ok: true, code: "WELCOME10", discount: 1000 });
  });

  it("normalizes the code to uppercase before querying", async () => {
    mockFoundCoupon(baseCoupon);
    await checkCoupon("  welcome10  ", 1000);
    expect(CouponModel.findOne).toHaveBeenCalledWith({ code: "WELCOME10" });
  });
});
