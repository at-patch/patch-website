import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import CouponModel from "@/lib/models/Coupon";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const items = await CouponModel.find({}).sort({ createdAt: -1 });
  return NextResponse.json({ success: true, data: items, total: items.length, page: 1, limit: items.length });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const body = await request.json();

  try {
    const coupon = await CouponModel.create(body);
    return NextResponse.json({ success: true, data: coupon }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create coupon.";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
