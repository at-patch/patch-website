import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import OrderModel from "@/lib/models/Order";
import { requireAdmin } from "@/lib/require-admin";
import { refundOrder } from "@/lib/stripe";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;

  const order = await OrderModel.findById(id);
  if (!order) {
    return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
  }

  const result = await refundOrder(order);
  if (!result.refunded) {
    return NextResponse.json({ success: false, message: result.reason }, { status: 400 });
  }

  const updated = await OrderModel.findById(id);
  return NextResponse.json({ success: true, data: updated });
}
