import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import OrderModel from "@/lib/models/Order";
import { requireAdmin } from "@/lib/require-admin";

const ORDER_STATUSES = ["placed", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;
const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const paymentStatus = searchParams.get("paymentStatus");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "50") || 50));

  if (status && !ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
    return NextResponse.json({ success: false, message: "Invalid order status." }, { status: 400 });
  }
  if (paymentStatus && !PAYMENT_STATUSES.includes(paymentStatus as (typeof PAYMENT_STATUSES)[number])) {
    return NextResponse.json({ success: false, message: "Invalid payment status." }, { status: 400 });
  }

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  const [orders, total] = await Promise.all([
    OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    OrderModel.countDocuments(filter),
  ]);
  return NextResponse.json({ success: true, data: orders, total, page, limit });
}
