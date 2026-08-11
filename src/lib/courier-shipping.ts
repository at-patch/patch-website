export type CourierClass = "premium" | "express" | "economy";

export const COURIER_CLASSES: CourierClass[] = ["premium", "express", "economy"];

export const COURIER_CLASS_LABELS: Record<CourierClass, string> = {
  premium: "Premium",
  express: "Express",
  economy: "Economy",
};

export interface CourierRateTier {
  courierClass: CourierClass;
  minWeightKg: number;
  maxWeightKg: number;
  pricingType: "flat" | "per_kg";
  rate: number;
  isDocument?: boolean;
}

// Flat per-shipment rates apply in 0.5kg steps up to and including 10kg.
export const FLAT_WEIGHT_STEPS_KG = [
  0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0,
];

// Above 10kg, the courier card prices per additional kg within a band.
export const PER_KG_BANDS: Array<{ minWeightKg: number; maxWeightKg: number }> = [
  { minWeightKg: 11, maxWeightKg: 15 },
  { minWeightKg: 16, maxWeightKg: 20 },
  { minWeightKg: 21, maxWeightKg: 30 },
  { minWeightKg: 31, maxWeightKg: 40 },
  { minWeightKg: 41, maxWeightKg: 50 },
  { minWeightKg: 51, maxWeightKg: 70 },
  { minWeightKg: 71, maxWeightKg: 300 },
  { minWeightKg: 301, maxWeightKg: 500 },
  { minWeightKg: 501, maxWeightKg: 1000 },
];

export const MAX_COURIER_WEIGHT_KG = 1000;

/**
 * International parcels round up to the nearest 0.5kg step below 10kg (matching
 * the courier's discrete rate card), then to the nearest whole kg above that.
 */
export function getInternationalChargeableWeightKg(totalWeightKg: number): number {
  if (!Number.isFinite(totalWeightKg) || totalWeightKg < 0) {
    throw new Error("Total weight must be a non-negative number.");
  }
  if (totalWeightKg <= 0) return FLAT_WEIGHT_STEPS_KG[0];
  if (totalWeightKg <= 10) {
    return Math.ceil(totalWeightKg * 2) / 2;
  }
  return Math.ceil(totalWeightKg);
}

export function calculateCourierRate(
  totalWeightKg: number,
  courierClass: CourierClass,
  tiers: CourierRateTier[]
): { chargeableWeightKg: number; shippingCost: number } | null {
  const chargeableWeightKg = getInternationalChargeableWeightKg(totalWeightKg);
  if (chargeableWeightKg > MAX_COURIER_WEIGHT_KG) return null;

  const candidates = tiers.filter((tier) => tier.courierClass === courierClass && !tier.isDocument);

  const flatTier = candidates
    .filter((tier) => tier.pricingType === "flat")
    .sort((a, b) => a.maxWeightKg - b.maxWeightKg)
    .find((tier) => chargeableWeightKg <= tier.maxWeightKg);
  if (flatTier) {
    return { chargeableWeightKg, shippingCost: flatTier.rate };
  }

  const bandTier = candidates.find(
    (tier) =>
      tier.pricingType === "per_kg" &&
      chargeableWeightKg >= tier.minWeightKg &&
      chargeableWeightKg <= tier.maxWeightKg
  );
  if (bandTier) {
    return { chargeableWeightKg, shippingCost: Math.round(chargeableWeightKg * bandTier.rate) };
  }

  return null;
}

export function listAvailableCourierClasses(
  tiers: CourierRateTier[],
  totalWeightKg: number
): Array<{ courierClass: CourierClass; shippingCost: number }> {
  return COURIER_CLASSES.flatMap((courierClass) => {
    const result = calculateCourierRate(totalWeightKg, courierClass, tiers);
    return result ? [{ courierClass, shippingCost: result.shippingCost }] : [];
  });
}
