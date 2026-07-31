export interface WeightShippingRule {
  baseRate: number;
  additionalKgRate: number;
}

export function getChargeableWeightKg(totalWeightKg: number) {
  if (!Number.isFinite(totalWeightKg) || totalWeightKg < 0) {
    throw new Error("Total weight must be a non-negative number.");
  }
  return Math.max(1, Math.ceil(totalWeightKg));
}

export function calculateWeightShipping(
  totalWeightKg: number,
  rule: WeightShippingRule
) {
  if (rule.baseRate < 0 || rule.additionalKgRate < 0) {
    throw new Error("Shipping rates must be non-negative.");
  }

  const chargeableWeightKg = getChargeableWeightKg(totalWeightKg);
  const shippingCost =
    rule.baseRate + Math.max(0, chargeableWeightKg - 1) * rule.additionalKgRate;

  return { totalWeightKg, chargeableWeightKg, shippingCost };
}
