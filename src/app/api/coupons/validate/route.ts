import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { checkCoupon } from "@/lib/coupons";

export async function POST(request: NextRequest) {
  await connectToDatabase();
  const { code, subtotal } = await request.json();

  if (typeof code !== "string" || typeof subtotal !== "number" || subtotal < 0) {
    return NextResponse.json({ success: false, message: "Invalid request." }, { status: 400 });
  }

  const result = await checkCoupon(code, subtotal);
  if (!result.ok) {
    return NextResponse.json({ success: false, message: result.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: { code: result.code, discount: result.discount } });
}
