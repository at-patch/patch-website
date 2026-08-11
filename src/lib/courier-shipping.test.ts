import { describe, expect, it } from "vitest";
import {
  calculateCourierRate,
  getInternationalChargeableWeightKg,
  listAvailableCourierClasses,
  type CourierRateTier,
} from "./courier-shipping";

const ASIA_TIERS: CourierRateTier[] = [
  { courierClass: "premium", minWeightKg: 0.5, maxWeightKg: 0.5, pricingType: "flat", rate: 5500 },
  { courierClass: "premium", minWeightKg: 1.0, maxWeightKg: 1.0, pricingType: "flat", rate: 6900 },
  { courierClass: "premium", minWeightKg: 10, maxWeightKg: 10, pricingType: "flat", rate: 26900 },
  { courierClass: "premium", minWeightKg: 11, maxWeightKg: 15, pricingType: "per_kg", rate: 2650 },
  { courierClass: "premium", minWeightKg: 16, maxWeightKg: 20, pricingType: "per_kg", rate: 2550 },
  { courierClass: "express", minWeightKg: 0.5, maxWeightKg: 0.5, pricingType: "flat", rate: 2800 },
  { courierClass: "express", minWeightKg: 501, maxWeightKg: 1000, pricingType: "per_kg", rate: 900 },
];

// Middle East only sells Economy from 41kg upward, matching the real rate card.
const MIDDLE_EAST_TIERS: CourierRateTier[] = [
  { courierClass: "premium", minWeightKg: 0.5, maxWeightKg: 0.5, pricingType: "flat", rate: 5200 },
  { courierClass: "economy", minWeightKg: 41, maxWeightKg: 50, pricingType: "per_kg", rate: 420 },
];

describe("getInternationalChargeableWeightKg", () => {
  it.each([
    [0.1, 0.5],
    [0.5, 0.5],
    [0.6, 1.0],
    [1.0, 1.0],
    [9.6, 10.0],
    [10.0, 10.0],
  ])("rounds %s kg up to the nearest 0.5kg step below 10kg (%s)", (weight, expected) => {
    expect(getInternationalChargeableWeightKg(weight)).toBe(expected);
  });

  it.each([
    [10.1, 11],
    [15, 15],
    [15.2, 16],
    [999.1, 1000],
  ])("rounds %s kg up to the nearest whole kg above 10kg (%s)", (weight, expected) => {
    expect(getInternationalChargeableWeightKg(weight)).toBe(expected);
  });

  it("rejects negative weight", () => {
    expect(() => getInternationalChargeableWeightKg(-1)).toThrow();
  });
});

describe("calculateCourierRate", () => {
  it("looks up the flat rate for a weight under 10kg", () => {
    expect(calculateCourierRate(0.3, "premium", ASIA_TIERS)).toEqual({
      chargeableWeightKg: 0.5,
      shippingCost: 5500,
    });
    expect(calculateCourierRate(0.9, "premium", ASIA_TIERS)).toEqual({
      chargeableWeightKg: 1.0,
      shippingCost: 6900,
    });
  });

  it("multiplies weight by the per-kg band rate above 10kg", () => {
    expect(calculateCourierRate(12, "premium", ASIA_TIERS)).toEqual({
      chargeableWeightKg: 12,
      shippingCost: 12 * 2650,
    });
    expect(calculateCourierRate(15.4, "premium", ASIA_TIERS)).toEqual({
      chargeableWeightKg: 16,
      shippingCost: 16 * 2550,
    });
  });

  it("returns null when no tier covers the weight or class", () => {
    expect(calculateCourierRate(50, "premium", ASIA_TIERS)).toBeNull();
    expect(calculateCourierRate(3, "economy", ASIA_TIERS)).toBeNull();
  });

  it("rejects weight above the courier's supported maximum", () => {
    expect(calculateCourierRate(1200, "express", ASIA_TIERS)).toBeNull();
  });

  it("ignores document-only tiers for regular parcels", () => {
    const withDocument: CourierRateTier[] = [
      { courierClass: "premium", minWeightKg: 0.5, maxWeightKg: 0.5, pricingType: "flat", rate: 4500, isDocument: true },
      { courierClass: "premium", minWeightKg: 0.5, maxWeightKg: 0.5, pricingType: "flat", rate: 5500 },
    ];
    expect(calculateCourierRate(0.3, "premium", withDocument)?.shippingCost).toBe(5500);
  });
});

describe("listAvailableCourierClasses", () => {
  it("only lists classes with a matching tier for the given weight", () => {
    expect(listAvailableCourierClasses(MIDDLE_EAST_TIERS, 0.4)).toEqual([
      { courierClass: "premium", shippingCost: 5200 },
    ]);
    expect(listAvailableCourierClasses(MIDDLE_EAST_TIERS, 45)).toEqual([
      { courierClass: "economy", shippingCost: 45 * 420 },
    ]);
  });

  it("returns an empty list when nothing covers the weight", () => {
    expect(listAvailableCourierClasses(MIDDLE_EAST_TIERS, 25)).toEqual([]);
  });
});
