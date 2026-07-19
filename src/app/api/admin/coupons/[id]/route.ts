import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import CouponModel from "@/lib/models/Coupon";
import { requireAdmin } from "@/lib/require-admin";
import { parseJsonBody } from "@/lib/validation";
import { updateCouponSchema } from "@/lib/validation/coupon.schemas";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  const parsed = await parseJsonBody(request, updateCouponSchema);
  if (!parsed.success) return parsed.response;

  await connectToDatabase();
  const { id } = await params;

  try {
    const coupon = await CouponModel.findByIdAndUpdate(id, parsed.data, { new: true, runValidators: true });
    if (!coupon) {
      return NextResponse.json({ success: false, message: "Coupon not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: coupon });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update coupon.";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;

  const coupon = await CouponModel.findByIdAndDelete(id);
  if (!coupon) {
    return NextResponse.json({ success: false, message: "Coupon not found." }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: null });
}
