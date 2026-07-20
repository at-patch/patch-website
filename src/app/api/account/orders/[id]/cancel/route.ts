import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import OrderModel from "@/lib/models/Order";
import { releaseOrderStock } from "@/lib/inventory";
import { refundStripePayment } from "@/lib/stripe";
import { requireCustomer } from "@/lib/require-customer";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const customerId = await requireCustomer(request);
  if (!customerId) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;

  // Status guard lives in the filter so a concurrent fulfillment update can't
  // race this into cancelling an already-shipped order.
  const order = await OrderModel.findOneAndUpdate(
    { _id: id, customer: customerId, status: { $in: ["placed", "confirmed"] } },
    { $set: { status: "cancelled" } },
    { new: true }
  );

  if (!order) {
    return NextResponse.json(
      { success: false, message: "This order can no longer be cancelled." },
      { status: 400 }
    );
  }

  await releaseOrderStock(order);

  if (order.paymentStatus === "paid" && order.paymentMethod === "card" && order.stripePaymentIntentId) {
    try {
      await refundStripePayment(order.stripePaymentIntentId);
      order.paymentStatus = "refunded";
      await order.save();
    } catch {
      // Cancellation stands; the team can retry the refund from the admin panel.
    }
  }

  return NextResponse.json({ success: true, data: order });
}
