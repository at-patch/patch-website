import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import OrderModel from "@/lib/models/Order";
import { requireCustomer } from "@/lib/require-customer";
import { releaseOrderStock } from "@/lib/inventory";
import { refundOrder } from "@/lib/stripe";

const CANCELLABLE_STATUSES = ["placed", "confirmed", "processing"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const customerId = await requireCustomer(request);
  if (!customerId) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;
  const { status } = await request.json();

  if (status !== "cancelled") {
    return NextResponse.json({ success: false, message: "Unsupported action." }, { status: 400 });
  }

  const order = await OrderModel.findById(id);
  if (!order || String(order.customer) !== customerId) {
    return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
  }

  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    return NextResponse.json(
      { success: false, message: "This order can no longer be cancelled." },
      { status: 400 }
    );
  }

  await releaseOrderStock(order);
  if (order.paymentStatus === "paid") {
    await refundOrder(order);
  }
  await OrderModel.updateOne({ _id: order._id }, { $set: { status: "cancelled" } });

  const updated = await OrderModel.findById(id);
  return NextResponse.json({ success: true, data: updated });
}
