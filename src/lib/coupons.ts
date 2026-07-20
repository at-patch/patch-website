import CouponModel from "@/lib/models/Coupon";

export type CouponCheck =
  | { ok: true; discount: number; code: string }
  | { ok: false; message: string };

function computeDiscount(coupon: { type: string; value: number }, subtotal: number) {
  const raw = coupon.type === "percent" ? (subtotal * coupon.value) / 100 : coupon.value;
  return Math.min(Math.round(raw), subtotal);
}

// Read-only check — used to preview a discount in the cart/checkout UI.
export async function checkCoupon(code: string, subtotal: number): Promise<CouponCheck> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { ok: false, message: "Enter a discount code." };

  const coupon = await CouponModel.findOne({ code: normalized }).lean();
  if (!coupon || !coupon.active) return { ok: false, message: "That code isn't valid." };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return { ok: false, message: "That code has expired." };
  }
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    return { ok: false, message: "That code has been fully redeemed." };
  }
  if (subtotal < coupon.minSubtotal) {
    return { ok: false, message: `That code needs a minimum order of ${coupon.minSubtotal}.` };
  }

  return { ok: true, code: normalized, discount: computeDiscount(coupon, subtotal) };
}

// Atomically claims one use of the coupon (respecting the usage limit) so two
// concurrent checkouts can't both take the last redemption.
export async function claimCoupon(code: string, subtotal: number): Promise<CouponCheck> {
  const check = await checkCoupon(code, subtotal);
  if (!check.ok) return check;

  const claimed = await CouponModel.findOneAndUpdate(
    {
      code: check.code,
      active: true,
      $or: [{ usageLimit: 0 }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }],
    },
    { $inc: { usedCount: 1 } },
    { new: true }
  )
    .select("_id")
    .lean();

  if (!claimed) return { ok: false, message: "That code has been fully redeemed." };
  return check;
}

export async function releaseCouponClaim(code: string) {
  await CouponModel.updateOne(
    { code: code.trim().toUpperCase(), usedCount: { $gte: 1 } },
    { $inc: { usedCount: -1 } }
  );
}
