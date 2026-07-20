import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import OrderModel from "@/lib/models/Order";
import { releaseOrderStock } from "@/lib/inventory";
import { refundStripePayment } from "@/lib/stripe";
import { requireAdmin } from "@/lib/require-admin";

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
  if (order.paymentStatus !== "paid") {
    return NextResponse.json(
      { success: false, message: "Only paid orders can be refunded." },
      { status: 400 }
    );
  }

  if (order.paymentMethod === "card") {
    if (!order.stripePaymentIntentId) {
      return NextResponse.json(
        { success: false, message: "No Stripe payment is recorded on this order — refund it in the Stripe dashboard instead." },
        { status: 400 }
      );
    }
    try {
      await refundStripePayment(order.stripePaymentIntentId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Stripe refund failed.";
      return NextResponse.json({ success: false, message }, { status: 502 });
    }
  }

  order.paymentStatus = "refunded";
  // Not-yet-shipped orders go back on the shelf; shipped/delivered ones keep
  // their fulfillment status — restock those manually if the item comes back.
  const preShipment = ["placed", "confirmed", "processing"].includes(order.status);
  if (preShipment) {
    order.status = "cancelled";
  }
  await order.save();

  if (preShipment) {
    await releaseOrderStock(order);
  }

  return NextResponse.json({ success: true, data: order });
}
