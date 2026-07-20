import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { checkCoupon } from "@/lib/coupons";
import { parseJsonBody } from "@/lib/validation";
import { validateCouponSchema } from "@/lib/validation/coupon.schemas";

export async function POST(request: NextRequest) {
  const parsed = await parseJsonBody(request, validateCouponSchema);
  if (!parsed.success) return parsed.response;
  const { code, subtotal } = parsed.data;

  await connectToDatabase();
  const result = await checkCoupon(code, subtotal);
  if (!result.ok) {
    return NextResponse.json({ success: false, message: result.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: { code: result.code, discount: result.discount } });
}
