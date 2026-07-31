import { describe, expect, it } from "vitest";
import { calculateWeightShipping, getChargeableWeightKg } from "./shipping";

describe("weight-based shipping", () => {
  it.each([
    [0.4, 1],
    [1, 1],
    [2, 2],
    [3.5, 4],
  ])("rounds %s kg to %s chargeable kg", (weight, expected) => {
    expect(getChargeableWeightKg(weight)).toBe(expected);
  });

  it("charges a base first kg plus each additional kg", () => {
    expect(calculateWeightShipping(3.5, { baseRate: 100, additionalKgRate: 40 })).toEqual({
      totalWeightKg: 3.5,
      chargeableWeightKg: 4,
      shippingCost: 220,
    });
  });

  it("rejects invalid weight and rates", () => {
    expect(() => getChargeableWeightKg(-1)).toThrow();
    expect(() => calculateWeightShipping(1, { baseRate: -1, additionalKgRate: 0 })).toThrow();
  });
});
